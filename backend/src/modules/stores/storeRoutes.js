/**
 * QuickKart: Quick-Commerce Management System
 * Dark Stores Routes
 */

const express = require('express');
const router = express.Router();
const storeController = require('./storeController');

router.get('/nearby', storeController.getNearbyStore);
router.get('/', storeController.getAllStores);
router.get('/:id', storeController.getStoreById);

module.exports = router;
