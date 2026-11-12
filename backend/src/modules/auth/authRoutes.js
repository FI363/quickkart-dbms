/**
 * QuickKart: Quick-Commerce Management System
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const authController = require('./authController');
const { authenticateToken } = require('../../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/demo-token/:role', authController.getDemoToken);
router.get('/demo-token', authController.getDemoToken);
router.get('/me', authenticateToken, authController.me);

module.exports = router;
