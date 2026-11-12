/**
 * QuickKart: Quick-Commerce Management System
 * Delivery Fleet Routes
 */

const express = require('express');
const router = express.Router();
const deliveryController = require('./deliveryController');
const { authenticateToken } = require('../../middleware/auth');
const { roleGuard } = require('../../middleware/roleGuard');

router.use(authenticateToken);

router.get('/riders', roleGuard('DELIVERY_PARTNER', 'STORE_MANAGER', 'ADMIN'), deliveryController.getAvailableRiders);
router.post('/assign', roleGuard('STORE_MANAGER', 'ADMIN'), deliveryController.assignDelivery);
router.patch('/:id/status', roleGuard('DELIVERY_PARTNER', 'STORE_MANAGER', 'ADMIN'), deliveryController.updateDeliveryStatus);
router.get('/performance', roleGuard('DELIVERY_PARTNER', 'STORE_MANAGER', 'ADMIN'), deliveryController.getPerformance);

module.exports = router;
