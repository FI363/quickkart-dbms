-- ============================================================================
-- QuickKart: Quick-Commerce Management System
-- Script: 09_test_queries.sql
-- Description: Verification queries and execution demonstrations for:
--              1. Analytical Views (Catalogue, Low Stock, Sales, History, Fleet)
--              2. Stored Functions (Stock, Cart Math, Haversine Distance, SLA)
--              3. Stored Procedures (Checkout, Restock, Dispatch, Cancellation)
--              4. Query Execution Plans (EXPLAIN demonstrating Index Optimization)
-- ============================================================================

USE quickkart_db;
SET NAMES utf8mb4;

-- ----------------------------------------------------------------------------
-- TEST 1: ANALYTICAL REPORTING VIEWS
-- ----------------------------------------------------------------------------

-- 1.1 Available Products at T. Nagar Dark Store (Store #1)
SELECT 
    product_name, 
    brand_name, 
    variant_name, 
    unit, 
    price, 
    total_quantity, 
    reserved_quantity, 
    available_quantity, 
    stock_status
FROM vw_available_products
WHERE store_id = 1
ORDER BY category_name, product_name
LIMIT 10;

-- 1.2 Low Stock Alert Report (Items requiring urgent replenishment)
SELECT 
    store_name, 
    store_area, 
    product_name, 
    variant_name, 
    unit, 
    total_quantity, 
    reorder_level, 
    recommended_reorder_qty, 
    alert_severity
FROM vw_low_stock;

-- 1.3 Daily Store Sales & Performance
SELECT 
    sale_date, 
    store_name, 
    total_orders, 
    delivered_orders, 
    gross_merchandise_value, 
    net_settled_revenue, 
    average_order_value
FROM vw_daily_store_sales;

-- 1.4 Customer Order History Projection
SELECT 
    order_number, 
    customer_name, 
    fulfillment_hub, 
    total_item_units, 
    total_amount, 
    order_status, 
    payment_status, 
    delivery_partner_name, 
    partner_vehicle
FROM vw_customer_order_history
LIMIT 5;

-- 1.5 Delivery Fleet Performance & SLA
SELECT 
    partner_name, 
    vehicle_type, 
    availability_status, 
    rating, 
    completed_deliveries, 
    avg_delivery_minutes, 
    completion_percentage
FROM vw_delivery_performance;

-- ----------------------------------------------------------------------------
-- TEST 2: STORED FUNCTIONS
-- ----------------------------------------------------------------------------

-- 2.1 Calculate Available Stock
SELECT 
    'Amul Milk 500ml at T. Nagar' AS Product_Query, 
    fn_get_available_stock(1, 1) AS Available_Units;

-- 2.2 Calculate Cart Total
SELECT 
    'Cart #1 Subtotal' AS Cart_Query, 
    fn_calculate_cart_total(1) AS Computed_Subtotal;

-- 2.3 Haversine Distance between T. Nagar Hub and Adyar Customer Address
SELECT 
    'Distance from T. Nagar to Adyar' AS Route_Query, 
    CONCAT(CAST(fn_haversine_distance(13.0418000, 80.2341000, 13.0063000, 80.2575000) AS CHAR), ' km') AS Calculated_Distance;

-- 2.4 Serviceability Check
SELECT 
    'Is T. Nagar Hub servicing Address #1 (Pondy Bazaar)?' AS Query,
    IF(fn_is_store_servicing_address(1, 1) = 1, 'YES (Within 4.5 km)', 'NO') AS Serviceable;

-- ----------------------------------------------------------------------------
-- TEST 3: STORED PROCEDURES (Simulated Transactions)
-- ----------------------------------------------------------------------------

-- 3.1 Restock Inventory Procedure Test
SET @p_status_code = 0;
SET @p_status_msg = '';

CALL sp_add_inventory(1, 23, 25, 'Emergency restock of Tata Tea at T. Nagar hub', @p_status_code, @p_status_msg);

SELECT 
    'Restock Test Result' AS Test, 
    @p_status_code AS StatusCode, 
    @p_status_msg AS Message;

-- Verify new stock level for Tata Tea (Variant #23 at Store #1)
SELECT store_id, variant_id, total_quantity, reserved_quantity, (total_quantity - reserved_quantity) AS available_quantity
FROM store_inventory 
WHERE store_id = 1 AND variant_id = 23;

-- 3.2 Dispatch / Assign Delivery Partner Test
SET @p_assign_code = 0;
SET @p_assign_msg = '';

-- Order #4 is PACKING at Store 4; assign available partner #4
CALL sp_assign_delivery(4, 4, @p_assign_code, @p_assign_msg);

SELECT 
    'Rider Dispatch Test Result' AS Test, 
    @p_assign_code AS StatusCode, 
    @p_assign_msg AS Message;

-- Check updated delivery status and rider availability
SELECT order_id, partner_id, delivery_status, assigned_at, estimated_delivery_time 
FROM deliveries 
WHERE order_id = 4;

SELECT partner_id, availability_status 
FROM delivery_partners 
WHERE partner_id = 4;

-- 3.3 Inter-Store Stock Transfer Test
SET @p_trf_id = 0;
SET @p_trf_code = 0;
SET @p_trf_msg = '';

-- Transfer 10 units of Bread (Variant #7) from Anna Nagar (Store 4) to Velachery (Store 3)
CALL sp_transfer_inventory(4, 3, 7, 10, 'Routine evening replenishment', @p_trf_id, @p_trf_code, @p_trf_msg);

SELECT 
    'Stock Transfer Test Result' AS Test, 
    @p_trf_id AS TransferID, 
    @p_trf_code AS StatusCode, 
    @p_trf_msg AS Message;

-- 3.4 Expired Reservations Sweep Test
SET @p_released_count = 0;
CALL sp_release_expired_reservations(@p_released_count);
SELECT 'Expired Reservations Swept' AS Test, @p_released_count AS ReleasedCount;

-- ----------------------------------------------------------------------------
-- TEST 4: QUERY OPTIMIZATION & EXPLAIN ANALYZE
-- ----------------------------------------------------------------------------

-- Verify composite index usage on store inventory lookup
EXPLAIN SELECT * FROM store_inventory WHERE store_id = 1 AND variant_id = 1;

-- Verify index usage on customer order query
EXPLAIN SELECT * FROM orders WHERE user_id = 12 ORDER BY created_at DESC;

-- Verify index usage on stock reservation sweeps
EXPLAIN SELECT * FROM stock_reservations WHERE reservation_status = 'ACTIVE' AND expires_at < NOW();

SELECT 'All Phase 2 test queries completed successfully!' AS Status;
