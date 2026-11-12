/**
 * QuickKart: Quick-Commerce Management System
 * Users & Addresses Routes
 */

const express = require('express');
const router = express.Router();
const userController = require('./userController');
const { authenticateToken } = require('../../middleware/auth');
const { roleGuard } = require('../../middleware/roleGuard');

router.get('/addresses', authenticateToken, userController.getAddresses);
router.post('/addresses', authenticateToken, userController.addAddress);
router.delete('/addresses/:id', authenticateToken, userController.deleteAddress);

// Admin-only user list
router.get('/', authenticateToken, roleGuard('ADMIN'), userController.getAllUsers);

module.exports = router;
