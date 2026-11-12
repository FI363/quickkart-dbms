/**
 * QuickKart: Quick-Commerce Management System
 * Shopping Cart Routes
 */

const express = require('express');
const router = express.Router();
const cartController = require('./cartController');
const { authenticateToken } = require('../../middleware/auth');

router.use(authenticateToken);

router.get('/', cartController.getCart);
router.post('/items', cartController.addItem);
router.delete('/items/:variantId', cartController.removeItem);
router.delete('/', cartController.clearCart);

module.exports = router;
