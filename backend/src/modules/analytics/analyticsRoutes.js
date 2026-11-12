/**
 * QuickKart: Quick-Commerce Management System
 * Analytics Routes
 */

const express = require('express');
const router = express.Router();
const analyticsController = require('./analyticsController');
const { authenticateToken } = require('../../middleware/auth');
const { roleGuard } = require('../../middleware/roleGuard');

router.use(authenticateToken);

router.get('/sold-products', analyticsController.getSoldProducts);
router.get('/dba-records', analyticsController.getDbaRecords);

router.use(roleGuard('STORE_MANAGER', 'ADMIN'));

router.get('/daily-sales', analyticsController.getDailySales);
router.get('/summary', analyticsController.getSummary);

module.exports = router;
