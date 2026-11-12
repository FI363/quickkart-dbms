/**
 * QuickKart: Quick-Commerce Management System
 * Payments Routes
 */

const express = require('express');
const router = express.Router();
const paymentController = require('./paymentController');
const { authenticateToken } = require('../../middleware/auth');

router.post('/', authenticateToken, paymentController.simulatePayment);
router.get('/:orderId', authenticateToken, paymentController.getPaymentByOrder);

module.exports = router;
