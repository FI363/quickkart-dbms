/**
 * QuickKart: Quick-Commerce Management System
 * Product & Catalogue Routes
 */

const express = require('express');
const router = express.Router();
const productController = require('./productController');

router.get('/categories', productController.getCategories);
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

module.exports = router;
