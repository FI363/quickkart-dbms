-- ============================================================================
-- QuickKart: Quick-Commerce Management System
-- Script: 05_views.sql
-- Description: Analytical and operational reporting views providing pre-computed,
--              denormalized projections without data redundancy.
-- ============================================================================

USE quickkart_db;

-- ----------------------------------------------------------------------------
-- 1. vw_available_products
-- Shows all active catalogue products and variants along with their real-time
-- stock availability aggregated across dark stores or per store.
-- ----------------------------------------------------------------------------
DROP VIEW IF EXISTS vw_available_products;
CREATE VIEW vw_available_products AS
SELECT 
    p.product_id,
    p.product_name,
    p.image_url,
    c.category_name,
    b.brand_name,
    v.variant_id,
    v.sku,
    v.variant_name,
    v.unit,
    v.price,
    v.mrp,
    s.store_id,
    s.store_name,
    s.area AS store_area,
    COALESCE(i.total_quantity, 0) AS total_quantity,
    COALESCE(i.reserved_quantity, 0) AS reserved_quantity,
    GREATEST(0, COALESCE(i.total_quantity, 0) - COALESCE(i.reserved_quantity, 0)) AS available_quantity,
    CASE 
        WHEN (COALESCE(i.total_quantity, 0) - COALESCE(i.reserved_quantity, 0)) > 0 THEN 'IN_STOCK'
        ELSE 'OUT_OF_STOCK'
    END AS stock_status
FROM products p
JOIN categories c ON p.category_id = c.category_id
JOIN brands b ON p.brand_id = b.brand_id
JOIN product_variants v ON p.product_id = v.product_id AND v.is_active = TRUE
CROSS JOIN dark_stores s ON s.is_active = TRUE
LEFT JOIN store_inventory i ON s.store_id = i.store_id AND v.variant_id = i.variant_id
WHERE p.is_active = TRUE;

-- ----------------------------------------------------------------------------
-- 2. vw_low_stock
-- Operational alert view highlighting inventory that has fallen below or equal
-- to its reorder threshold, calculating the recommended replenishment quantity.
-- ----------------------------------------------------------------------------
DROP VIEW IF EXISTS vw_low_stock;
CREATE VIEW vw_low_stock AS
SELECT 
    i.inventory_id,
    s.store_id,
    s.store_name,
    s.area AS store_area,
    p.product_id,
    p.product_name,
    b.brand_name,
    v.variant_id,
    v.sku,
    v.variant_name,
    v.unit,
    i.total_quantity,
    i.reserved_quantity,
    (i.total_quantity - i.reserved_quantity) AS available_quantity,
    i.reorder_level,
    (i.reorder_level * 3 - i.total_quantity) AS recommended_reorder_qty,
    CASE 
        WHEN i.total_quantity = 0 THEN 'CRITICAL_ZERO'
        WHEN (i.total_quantity - i.reserved_quantity) <= 0 THEN 'RESERVED_DEPLETED'
        ELSE 'LOW_STOCK'
    END AS alert_severity,
    i.updated_at AS last_stock_update
FROM store_inventory i
JOIN dark_stores s ON i.store_id = s.store_id
JOIN product_variants v ON i.variant_id = v.variant_id
JOIN products p ON v.product_id = p.product_id
JOIN brands b ON p.brand_id = b.brand_id
WHERE i.total_quantity <= i.reorder_level
ORDER BY alert_severity ASC, available_quantity ASC;

-- ----------------------------------------------------------------------------
-- 3. vw_daily_store_sales
-- Aggregates daily financial performance per dark store: order count,
-- gross sales, delivery fee income, promo discounts, and net revenue.
-- ----------------------------------------------------------------------------
DROP VIEW IF EXISTS vw_daily_store_sales;
CREATE VIEW vw_daily_store_sales AS
SELECT 
    DATE(o.created_at) AS sale_date,
    s.store_id,
    s.store_name,
    s.area AS store_area,
    COUNT(o.order_id) AS total_orders,
    SUM(CASE WHEN o.order_status = 'DELIVERED' THEN 1 ELSE 0 END) AS delivered_orders,
    SUM(CASE WHEN o.order_status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_orders,
    SUM(CASE WHEN o.order_status != 'CANCELLED' THEN o.subtotal ELSE 0.00 END) AS gross_merchandise_value,
    SUM(CASE WHEN o.order_status != 'CANCELLED' THEN o.delivery_fee ELSE 0.00 END) AS total_delivery_fees,
    SUM(CASE WHEN o.order_status != 'CANCELLED' THEN o.discount ELSE 0.00 END) AS total_discounts,
    SUM(CASE WHEN o.order_status = 'DELIVERED' THEN o.total_amount ELSE 0.00 END) AS net_settled_revenue,
    ROUND(AVG(CASE WHEN o.order_status = 'DELIVERED' THEN o.total_amount ELSE NULL END), 2) AS average_order_value
FROM orders o
JOIN dark_stores s ON o.store_id = s.store_id
GROUP BY DATE(o.created_at), s.store_id, s.store_name, s.area
ORDER BY sale_date DESC, net_settled_revenue DESC;

-- ----------------------------------------------------------------------------
-- 4. vw_customer_order_history
-- Full consolidated customer invoice projection containing order details,
-- store hub, payment status, delivery status, and assigned fleet rider.
-- ----------------------------------------------------------------------------
DROP VIEW IF EXISTS vw_customer_order_history;
CREATE VIEW vw_customer_order_history AS
SELECT 
    o.order_id,
    o.order_number,
    o.created_at AS order_date,
    u.user_id AS customer_id,
    u.full_name AS customer_name,
    u.email AS customer_email,
    u.phone AS customer_phone,
    s.store_name AS fulfillment_hub,
    o.delivery_address_snapshot,
    (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.order_id) AS total_distinct_items,
    (SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi WHERE oi.order_id = o.order_id) AS total_item_units,
    o.subtotal,
    o.delivery_fee,
    o.discount,
    o.total_amount,
    o.order_status,
    pay.payment_method,
    COALESCE(pay.payment_status, 'UNPAID') AS payment_status,
    pay.transaction_reference,
    del.delivery_status,
    rider_user.full_name AS delivery_partner_name,
    rider.vehicle_type AS partner_vehicle,
    del.delivered_at
FROM orders o
JOIN users u ON o.user_id = u.user_id
JOIN dark_stores s ON o.store_id = s.store_id
LEFT JOIN payments pay ON o.order_id = pay.order_id
LEFT JOIN deliveries del ON o.order_id = del.order_id
LEFT JOIN delivery_partners rider ON del.partner_id = rider.partner_id
LEFT JOIN users rider_user ON rider.user_id = rider_user.user_id
ORDER BY o.created_at DESC;

-- ----------------------------------------------------------------------------
-- 5. vw_delivery_performance
-- Analytics view evaluating delivery fleet metrics: completed runs,
-- average fulfillment time (in minutes from dispatch to doorstep), and ratings.
-- ----------------------------------------------------------------------------
DROP VIEW IF EXISTS vw_delivery_performance;
CREATE VIEW vw_delivery_performance AS
SELECT 
    dp.partner_id,
    u.full_name AS partner_name,
    u.phone AS partner_phone,
    dp.vehicle_type,
    dp.vehicle_number,
    dp.availability_status,
    dp.rating,
    COUNT(d.delivery_id) AS total_assigned_deliveries,
    SUM(CASE WHEN d.delivery_status = 'DELIVERED' THEN 1 ELSE 0 END) AS completed_deliveries,
    SUM(CASE WHEN d.delivery_status = 'FAILED' THEN 1 ELSE 0 END) AS failed_deliveries,
    ROUND(
        AVG(
            CASE 
                WHEN d.delivery_status = 'DELIVERED' AND d.picked_up_at IS NOT NULL AND d.delivered_at IS NOT NULL 
                THEN TIMESTAMPDIFF(MINUTE, d.picked_up_at, d.delivered_at)
                ELSE NULL 
            END
        ), 1
    ) AS avg_delivery_minutes,
    ROUND(
        (SUM(CASE WHEN d.delivery_status = 'DELIVERED' THEN 1 ELSE 0 END) / NULLIF(COUNT(d.delivery_id), 0)) * 100, 
        1
    ) AS completion_percentage
FROM delivery_partners dp
JOIN users u ON dp.user_id = u.user_id
LEFT JOIN deliveries d ON dp.partner_id = d.partner_id
GROUP BY dp.partner_id, u.full_name, u.phone, dp.vehicle_type, dp.vehicle_number, dp.availability_status, dp.rating
ORDER BY completed_deliveries DESC, dp.rating DESC;

SELECT 'All 5 analytical reporting views created successfully!' AS Status;
