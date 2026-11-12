/**
 * QuickKart: Quick-Commerce Management System
 * Orders Routes
 */

const express = require('express');
const router = express.Router();
const orderController = require('./orderController');
const { authenticateToken } = require('../../middleware/auth');

router.use(authenticateToken);

router.post('/', orderController.placeOrder);
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.patch('/:id/cancel', orderController.cancelOrder);

module.exports = router;
