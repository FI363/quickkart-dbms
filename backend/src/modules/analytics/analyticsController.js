/**
 * QuickKart: Quick-Commerce Management System
 * Analytics & Executive Dashboard Controller
 */

const { query } = require('../../config/database');

// Daily sales report (via vw_daily_store_sales)
async function getDailySales(req, res) {
    try {
        const { storeId } = req.query;
        let sql = 'SELECT * FROM vw_daily_store_sales';
        const params = [];

        if (storeId) {
            sql += ' WHERE store_id = ?';
            params.push(storeId);
        }

        sql += ' ORDER BY sale_date DESC';
        const sales = await query(sql, params);
        return res.json({ success: true, count: sales.length, data: sales });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

// Executive KPI summary
async function getSummary(req, res) {
    try {
        const stats = await query(`
            SELECT 
                (SELECT COUNT(*) FROM dark_stores WHERE is_active = TRUE) AS total_dark_stores,
                (SELECT COUNT(*) FROM products WHERE is_active = TRUE) AS total_products,
                (SELECT COUNT(*) FROM product_variants WHERE is_active = TRUE) AS total_skus,
                (SELECT COUNT(*) FROM users WHERE role_id = (SELECT role_id FROM roles WHERE role_name = 'CUSTOMER')) AS total_customers,
                (SELECT COUNT(*) FROM delivery_partners WHERE availability_status = 'AVAILABLE') AS available_riders,
                (SELECT COUNT(*) FROM orders) AS total_orders,
                (SELECT COUNT(*) FROM orders WHERE order_status = 'DELIVERED') AS delivered_orders,
                (SELECT COUNT(*) FROM orders WHERE order_status IN ('PENDING', 'CONFIRMED', 'PACKING', 'OUT_FOR_DELIVERY')) AS active_orders,
                (SELECT COALESCE(SUM(total_amount), 0.00) FROM orders WHERE order_status = 'DELIVERED') AS total_revenue,
                (SELECT COUNT(*) FROM vw_low_stock) AS low_stock_alerts
        `);

        return res.json({
            success: true,
            data: stats[0]
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

// Line-by-line Sold Products Database Audit (Order Items with product name, amount, store, customer)
async function getSoldProducts(req, res) {
    try {
        const { storeId, search, limit = 150 } = req.query;
        let sql = `
            SELECT 
                oi.order_item_id,
                oi.order_id,
                oi.variant_id,
                oi.product_name_snapshot AS product_name,
                oi.variant_name_snapshot AS variant_name,
                oi.quantity,
                oi.unit_price,
                oi.subtotal AS total_amount,
                o.order_number,
                o.created_at AS sale_date,
                o.order_status,
                s.store_id,
                s.store_name,
                s.area AS store_area,
                u.user_id AS customer_id,
                u.full_name AS customer_name,
                u.email AS customer_email,
                p.product_id,
                p.image_url,
                c.category_name,
                b.brand_name
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            JOIN dark_stores s ON o.store_id = s.store_id
            JOIN users u ON o.user_id = u.user_id
            LEFT JOIN product_variants pv ON oi.variant_id = pv.variant_id
            LEFT JOIN products p ON pv.product_id = p.product_id
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            WHERE 1=1
        `;
        const params = [];

        if (storeId) {
            sql += ' AND o.store_id = ?';
            params.push(parseInt(storeId, 10));
        }

        if (search) {
            sql += ' AND (oi.product_name_snapshot LIKE ? OR oi.variant_name_snapshot LIKE ? OR o.order_number LIKE ? OR u.full_name LIKE ? OR s.store_name LIKE ?)';
            const term = `%${search.trim()}%`;
            params.push(term, term, term, term, term);
        }

        sql += ' ORDER BY o.created_at DESC, oi.order_item_id DESC LIMIT ?';
        params.push(parseInt(limit, 10));

        const items = await query(sql, params);

        // Aggregate statistics
        let totalSoldQuantity = 0;
        let totalRevenue = 0;
        const productStats = {};

        for (const item of items) {
            const qty = Number(item.quantity) || 0;
            const amt = Number(item.total_amount) || 0;
            totalSoldQuantity += qty;
            totalRevenue += amt;

            const name = item.product_name;
            if (!productStats[name]) {
                productStats[name] = {
                    product_name: name,
                    category_name: item.category_name || 'General',
                    brand_name: item.brand_name || 'Generic',
                    image_url: item.image_url,
                    units_sold: 0,
                    total_amount: 0,
                    orders_count: 0
                };
            }
            productStats[name].units_sold += qty;
            productStats[name].total_amount += amt;
            productStats[name].orders_count += 1;
        }

        const topProducts = Object.values(productStats).sort((a, b) => b.total_amount - a.total_amount);

        return res.json({
            success: true,
            count: items.length,
            summary: {
                totalSoldQuantity,
                totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                distinctProductsCount: topProducts.length
            },
            topProducts,
            data: items
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

// Comprehensive DBA Explorer Records (Customer, Product, Order, Payment, Delivery, Stock)
async function getDbaRecords(req, res) {
    try {
        const [
            customers,
            addresses,
            products,
            orders,
            payments,
            refunds,
            deliveries,
            fleet
        ] = await Promise.all([
            query(`
                SELECT 
                    u.user_id,
                    u.full_name,
                    r.role_name,
                    u.email,
                    u.phone,
                    u.account_status,
                    COALESCE(a.address_line, ' Pondy Bazaar, T. Nagar') AS address_line,
                    COALESCE(a.area, 'T. Nagar') AS area,
                    COALESCE(a.city, 'Chennai') AS city,
                    COALESCE(a.pincode, '600017') AS pincode,
                    COUNT(DISTINCT o.order_id) AS orders_placed,
                    COALESCE(SUM(CASE WHEN o.order_status != 'CANCELLED' THEN o.total_amount ELSE 0 END), 0) AS lifetime_spend,
                    u.created_at
                FROM users u
                JOIN roles r ON u.role_id = r.role_id
                LEFT JOIN addresses a ON u.user_id = a.user_id AND a.is_default = TRUE
                LEFT JOIN orders o ON u.user_id = o.user_id
                GROUP BY u.user_id, u.full_name, r.role_name, u.email, u.phone, u.account_status, a.address_line, a.area, a.city, a.pincode, u.created_at
                ORDER BY r.role_id DESC, u.user_id ASC
            `),
            query(`
                SELECT 
                    a.address_id,
                    a.user_id,
                    u.full_name AS customer_name,
                    a.address_type,
                    a.address_line,
                    a.area,
                    a.city,
                    a.pincode,
                    a.is_default
                FROM addresses a
                JOIN users u ON a.user_id = u.user_id
                ORDER BY a.address_id ASC
            `),
            query(`
                SELECT 
                    p.product_id,
                    v.variant_id,
                    v.sku,
                    p.product_name,
                    p.image_url,
                    COALESCE(b.brand_name, 'QuickKart Fresh') AS brand_name,
                    c.category_name,
                    v.variant_name,
                    v.unit,
                    v.price,
                    v.mrp,
                    (v.mrp - v.price) AS discount,
                    COALESCE(SUM(i.total_quantity), 0) AS total_quantity,
                    COALESCE(SUM(i.reserved_quantity), 0) AS reserved_quantity,
                    COALESCE(SUM(i.total_quantity - i.reserved_quantity), 0) AS available_stock
                FROM products p
                JOIN product_variants v ON p.product_id = v.product_id
                JOIN categories c ON p.category_id = c.category_id
                LEFT JOIN brands b ON p.brand_id = b.brand_id
                LEFT JOIN store_inventory i ON v.variant_id = i.variant_id
                GROUP BY p.product_id, v.variant_id, v.sku, p.product_name, p.image_url, b.brand_name, c.category_name, v.variant_name, v.unit, v.price, v.mrp
                ORDER BY p.product_id ASC, v.variant_id ASC
            `),
            query(`
                SELECT 
                    o.order_id,
                    o.order_number,
                    o.user_id,
                    u.full_name AS customer_name,
                    u.phone AS customer_phone,
                    o.store_id,
                    s.store_name,
                    s.area AS store_area,
                    o.delivery_address_snapshot,
                    COUNT(oi.order_item_id) AS sku_count,
                    COALESCE(SUM(oi.quantity), 0) AS total_units,
                    o.subtotal,
                    o.delivery_fee,
                    o.discount,
                    o.total_amount,
                    o.order_status,
                    o.created_at
                FROM orders o
                JOIN users u ON o.user_id = u.user_id
                JOIN dark_stores s ON o.store_id = s.store_id
                LEFT JOIN order_items oi ON o.order_id = oi.order_id
                GROUP BY o.order_id, o.order_number, o.user_id, u.full_name, u.phone, o.store_id, s.store_name, s.area, o.delivery_address_snapshot, o.subtotal, o.delivery_fee, o.discount, o.total_amount, o.order_status, o.created_at
                ORDER BY o.order_id DESC
            `),
            query(`
                SELECT 
                    p.payment_id,
                    p.order_id,
                    o.order_number,
                    u.full_name AS customer_name,
                    s.area AS store_area,
                    p.payment_method,
                    p.transaction_reference,
                    p.amount,
                    p.payment_status,
                    o.order_status,
                    COALESCE(p.paid_at, p.created_at) AS payment_date
                FROM payments p
                JOIN orders o ON p.order_id = o.order_id
                JOIN users u ON o.user_id = u.user_id
                JOIN dark_stores s ON o.store_id = s.store_id
                ORDER BY p.payment_id DESC
            `),
            query(`
                SELECT 
                    r.refund_id,
                    r.payment_id,
                    o.order_number,
                    p.transaction_reference,
                    r.refund_reference,
                    r.refund_amount,
                    r.refund_reason,
                    r.refund_status,
                    r.created_at
                FROM refunds r
                JOIN payments p ON r.payment_id = p.payment_id
                JOIN orders o ON p.order_id = o.order_id
                ORDER BY r.refund_id DESC
            `),
            query(`
                SELECT 
                    d.delivery_id,
                    d.order_id,
                    o.order_number,
                    u_cust.full_name AS customer_name,
                    s.store_name,
                    s.area AS store_area,
                    o.delivery_address_snapshot,
                    COALESCE(u_rider.full_name, 'Unassigned') AS partner_name,
                    COALESCE(u_rider.phone, '-') AS partner_phone,
                    COALESCE(dp.vehicle_type, '-') AS vehicle_type,
                    COALESCE(dp.vehicle_number, '-') AS vehicle_number,
                    d.delivery_status,
                    d.assigned_at,
                    d.picked_up_at,
                    d.delivered_at,
                    d.estimated_delivery_time
                FROM deliveries d
                JOIN orders o ON d.order_id = o.order_id
                JOIN users u_cust ON o.user_id = u_cust.user_id
                JOIN dark_stores s ON o.store_id = s.store_id
                LEFT JOIN delivery_partners dp ON d.partner_id = dp.partner_id
                LEFT JOIN users u_rider ON dp.user_id = u_rider.user_id
                ORDER BY d.delivery_id DESC
            `),
            query(`
                SELECT * FROM vw_delivery_performance ORDER BY partner_id ASC
            `)
        ]);

        return res.json({
            success: true,
            data: {
                customers,
                addresses,
                products,
                orders,
                payments,
                refunds,
                deliveries,
                fleet
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    getDailySales,
    getSummary,
    getSoldProducts,
    getDbaRecords
};
