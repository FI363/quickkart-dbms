/**
 * QuickKart: Quick-Commerce Management System
 * Inventory Routes
 */

const express = require('express');
const router = express.Router();
const inventoryController = require('./inventoryController');
const { authenticateToken } = require('../../middleware/auth');
const { roleGuard } = require('../../middleware/roleGuard');

// Public/Customer check of a store's stock
router.get('/:storeId', inventoryController.getStoreInventory);

// Manager/Admin routes
router.get('/reports/low-stock', authenticateToken, roleGuard('STORE_MANAGER', 'ADMIN'), inventoryController.getLowStock);
router.get('/reports/transactions', authenticateToken, roleGuard('STORE_MANAGER', 'ADMIN'), inventoryController.getInventoryTransactions);
router.post('/restock', authenticateToken, roleGuard('STORE_MANAGER', 'ADMIN'), inventoryController.restockItem);
router.post('/transfer', authenticateToken, roleGuard('STORE_MANAGER', 'ADMIN'), inventoryController.transferStock);

module.exports = router;
