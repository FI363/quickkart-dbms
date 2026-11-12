/**
 * QuickKart: Quick-Commerce Management System
 * Master Express Router
 */

const express = require('express');
const router = express.Router();

const authRoutes = require('../modules/auth/authRoutes');
const userRoutes = require('../modules/users/userRoutes');
const productRoutes = require('../modules/products/productRoutes');
const storeRoutes = require('../modules/stores/storeRoutes');
const inventoryRoutes = require('../modules/inventory/inventoryRoutes');
const cartRoutes = require('../modules/cart/cartRoutes');
const orderRoutes = require('../modules/orders/orderRoutes');
const paymentRoutes = require('../modules/payments/paymentRoutes');
const deliveryRoutes = require('../modules/delivery/deliveryRoutes');
const analyticsRoutes = require('../modules/analytics/analyticsRoutes');

// Mount domain routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/stores', storeRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/deliveries', deliveryRoutes);
router.use('/analytics', analyticsRoutes);

module.exports = router;
