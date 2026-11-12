/**
 * QuickKart: Quick-Commerce Management System
 * Delivery Fleet Controller
 */

const { query } = require('../../config/database');

// List available riders
async function getAvailableRiders(req, res) {
    try {
        const riders = await query(
            `SELECT dp.*, u.full_name, u.phone, u.email
             FROM delivery_partners dp
             JOIN users u ON dp.user_id = u.user_id
             WHERE dp.availability_status = 'AVAILABLE'
             ORDER BY dp.rating DESC`
        );
        return res.json({ success: true, count: riders.length, data: riders });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

// Assign delivery rider (calls sp_assign_delivery)
async function assignDelivery(req, res) {
    try {
        const { orderId, partnerId } = req.body;

        if (!orderId || !partnerId) {
            return res.status(400).json({
                success: false,
                message: 'orderId and partnerId are required.'
            });
        }

        await query(
            `CALL sp_assign_delivery(?, ?, @p_status_code, @p_status_message)`,
            [orderId, partnerId]
        );

        const outRes = await query('SELECT @p_status_code AS statusCode, @p_status_message AS statusMessage');
        const { statusCode, statusMessage } = outRes[0];

        if (statusCode !== 200) {
            return res.status(statusCode).json({ success: false, message: statusMessage });
        }

        return res.json({ success: true, message: statusMessage });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

// Update delivery status (e.g. Rider sets PICKED_UP or DELIVERED)
async function updateDeliveryStatus(req, res) {
    try {
        const deliveryId = req.params.id;
        const { status, remarks = '' } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, message: 'status is required.' });
        }

        const validStatuses = ['ASSIGNED', 'PICKED_UP', 'DELIVERED', 'FAILED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        // Fetch current delivery
        const deliveries = await query('SELECT * FROM deliveries WHERE delivery_id = ?', [deliveryId]);
        if (deliveries.length === 0) {
            return res.status(404).json({ success: false, message: 'Delivery record not found.' });
        }

        const delivery = deliveries[0];
        let timestampUpdate = '';
        const params = [status];

        if (status === 'PICKED_UP') {
            timestampUpdate = ', picked_up_at = NOW()';
        } else if (status === 'DELIVERED') {
            timestampUpdate = ', delivered_at = NOW()';
        }

        params.push(deliveryId);

        // Update delivery record (Trigger trg_release_rider_on_delivered automatically frees partner if DELIVERED/FAILED)
        await query(
            `UPDATE deliveries SET delivery_status = ? ${timestampUpdate}, updated_at = NOW() WHERE delivery_id = ?`,
            params
        );

        // Update linked order status accordingly
        let orderStatus = 'PACKING';
        if (status === 'ASSIGNED') orderStatus = 'PACKING';
        if (status === 'PICKED_UP') orderStatus = 'OUT_FOR_DELIVERY';
        if (status === 'DELIVERED') orderStatus = 'DELIVERED';
        if (status === 'FAILED') orderStatus = 'CANCELLED';

        await query('UPDATE orders SET order_status = ? WHERE order_id = ?', [orderStatus, delivery.order_id]);

        return res.json({
            success: true,
            message: `Delivery updated to ${status}. Linked order updated to ${orderStatus}.`
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

// Fleet performance analytics (via vw_delivery_performance)
async function getPerformance(req, res) {
    try {
        const performance = await query('SELECT * FROM vw_delivery_performance');
        return res.json({ success: true, count: performance.length, data: performance });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    getAvailableRiders,
    assignDelivery,
    updateDeliveryStatus,
    getPerformance
};
