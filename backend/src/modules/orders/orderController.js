/**
 * QuickKart: Quick-Commerce Management System
 * Orders Controller (Transaction-safe checkout and cancellation)
 */

const { query } = require('../../config/database');

// Place order via stored procedure sp_place_order
async function placeOrder(req, res) {
    try {
        const userId = req.user.userId;
        const { storeId, addressId, paymentMethod = 'UPI' } = req.body;

        if (!storeId || !addressId) {
            return res.status(400).json({
                success: false,
                message: 'storeId and addressId are required.'
            });
        }

        // Call stored procedure sp_place_order and fetch OUT parameters in a single connection query
        const results = await query(
            `CALL sp_place_order(?, ?, ?, ?, @p_order_id, @p_order_number, @p_status_code, @p_status_message);
             SELECT 
                @p_order_id AS orderId, 
                @p_order_number AS orderNumber, 
                @p_status_code AS statusCode, 
                @p_status_message AS statusMessage;`,
            [userId, storeId, addressId, paymentMethod]
        );

        const outRows = Array.isArray(results[1]) ? results[1] : results;
        const { orderId, orderNumber, statusCode, statusMessage } = outRows[0] || {};

        if (statusCode !== 200) {
            return res.status(statusCode).json({
                success: false,
                message: statusMessage
            });
        }

        // Fetch placed order summary
        const orderSummary = await query(
            'SELECT * FROM orders WHERE order_id = ?',
            [orderId]
        );

        return res.status(201).json({
            success: true,
            message: statusMessage,
            data: {
                orderId,
                orderNumber,
                order: orderSummary[0]
            }
        });
    } catch (err) {
        console.error('Error placing order:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
}

// Get order history
async function getOrders(req, res) {
    try {
        const { roleName, userId } = req.user;
        const { storeId, status, limit = 50 } = req.query;

        let sql = 'SELECT * FROM vw_customer_order_history WHERE 1=1';
        const params = [];

        // Customers can only see their own orders
        if (roleName === 'CUSTOMER') {
            sql += ' AND customer_id = ?';
            params.push(userId);
        } else if (storeId) {
            sql += ' AND fulfillment_hub = (SELECT store_name FROM dark_stores WHERE store_id = ?)';
            params.push(storeId);
        }

        if (status) {
            sql += ' AND order_status = ?';
            params.push(status);
        }

        sql += ' ORDER BY order_date DESC LIMIT ?';
        params.push(parseInt(limit, 10));

        const orders = await query(sql, params);
        return res.json({ success: true, count: orders.length, data: orders });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

// Get specific order details (with snapshot line items and status audit trail)
async function getOrderById(req, res) {
    try {
        const orderId = req.params.id;
        const { roleName, userId } = req.user;

        // Fetch master order
        const orders = await query(
            `SELECT o.*, s.store_name, s.area AS store_area, u.full_name AS customer_name, u.phone AS customer_phone
             FROM orders o
             JOIN dark_stores s ON o.store_id = s.store_id
             JOIN users u ON o.user_id = u.user_id
             WHERE o.order_id = ?`,
            [orderId]
        );

        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        const order = orders[0];

        // Authorization check: customer cannot view someone else's order
        if (roleName === 'CUSTOMER' && order.user_id !== userId) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        // Fetch snapshot items
        order.items = await query(
            `SELECT oi.*, pv.unit, pv.sku, p.image_url
             FROM order_items oi
             JOIN product_variants pv ON oi.variant_id = pv.variant_id
             JOIN products p ON pv.product_id = p.product_id
             WHERE oi.order_id = ?`,
            [orderId]
        );

        // Fetch timeline / history
        order.timeline = await query(
            'SELECT * FROM order_status_history WHERE order_id = ? ORDER BY changed_at ASC',
            [orderId]
        );

        // Fetch payment record
        const payments = await query('SELECT * FROM payments WHERE order_id = ?', [orderId]);
        order.payment = payments.length > 0 ? payments[0] : null;

        // Fetch delivery dispatch record
        const deliveries = await query(
            `SELECT d.*, u.full_name AS partner_name, u.phone AS partner_phone, dp.vehicle_type, dp.vehicle_number
             FROM deliveries d
             LEFT JOIN delivery_partners dp ON d.partner_id = dp.partner_id
             LEFT JOIN users u ON dp.user_id = u.user_id
             WHERE d.order_id = ?`,
            [orderId]
        );
        order.delivery = deliveries.length > 0 ? deliveries[0] : null;

        return res.json({ success: true, data: order });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

// Cancel order via stored procedure sp_cancel_order
async function cancelOrder(req, res) {
    try {
        const orderId = req.params.id;
        const { reason = 'Cancelled by user' } = req.body;

        const results = await query(
            `CALL sp_cancel_order(?, ?, @p_status_code, @p_status_message);
             SELECT @p_status_code AS statusCode, @p_status_message AS statusMessage;`,
            [orderId, reason]
        );

        const outRows = Array.isArray(results[1]) ? results[1] : results;
        const { statusCode, statusMessage } = outRows[0] || {};

        if (statusCode !== 200) {
            return res.status(statusCode).json({ success: false, message: statusMessage });
        }

        return res.json({ success: true, message: statusMessage });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    placeOrder,
    getOrders,
    getOrderById,
    cancelOrder
};
