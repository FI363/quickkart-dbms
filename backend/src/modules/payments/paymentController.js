/**
 * QuickKart: Quick-Commerce Management System
 * Payments & Refunds Controller
 */

const { query } = require('../../config/database');

// Simulate payment authorization or webhook
async function simulatePayment(req, res) {
    try {
        const { orderId, paymentMethod = 'UPI', status = 'SUCCESS' } = req.body;

        if (!orderId) {
            return res.status(400).json({ success: false, message: 'orderId is required.' });
        }

        const orders = await query('SELECT total_amount FROM orders WHERE order_id = ?', [orderId]);
        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        const amount = orders[0].total_amount;
        const ref = `TXN-SIM-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

        // Check if payment already exists
        const existing = await query('SELECT payment_id FROM payments WHERE order_id = ?', [orderId]);

        if (existing.length > 0) {
            await query(
                `UPDATE payments 
                 SET payment_status = ?, paid_at = ?, payment_method = ?
                 WHERE payment_id = ?`,
                [status, status === 'SUCCESS' ? new Date() : null, paymentMethod, existing[0].payment_id]
            );
        } else {
            await query(
                `INSERT INTO payments (order_id, transaction_reference, payment_method, amount, payment_status, paid_at)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [orderId, ref, paymentMethod, amount, status, status === 'SUCCESS' ? new Date() : null]
            );
        }

        return res.json({
            success: true,
            message: `Payment simulation recorded as ${status}.`,
            data: { orderId, amount, status, reference: ref }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

// Get payment and refund details for an order
async function getPaymentByOrder(req, res) {
    try {
        const orderId = req.params.orderId;

        const payments = await query('SELECT * FROM payments WHERE order_id = ?', [orderId]);
        if (payments.length === 0) {
            return res.status(404).json({ success: false, message: 'No payment record for this order.' });
        }

        const payment = payments[0];
        const refunds = await query('SELECT * FROM refunds WHERE payment_id = ?', [payment.payment_id]);

        return res.json({
            success: true,
            data: {
                payment,
                refunds
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    simulatePayment,
    getPaymentByOrder
};
