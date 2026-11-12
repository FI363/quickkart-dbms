/**
 * QuickKart: Quick-Commerce Management System
 * Express Application Entry Point
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const { testConnection } = require('./config/database');
const apiRoutes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-demo-role']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${req.method}] ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'UP',
        service: 'QuickKart Backend API',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        service: 'QuickKart Backend API',
        timestamp: new Date().toISOString()
    });
});

// Mount master API routes
app.use('/api', apiRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Endpoint not found: ${req.method} ${req.originalUrl}`
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[UNCAUGHT SERVER ERROR]', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error occurred.',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Start server
if (require.main === module) {
    app.listen(PORT, async () => {
        console.log('====================================================');
        console.log(`🚀 QuickKart Server listening on http://localhost:${PORT}`);
        console.log(`📡 API Endpoints base: http://localhost:${PORT}/api`);
        console.log('====================================================');
        await testConnection();
    });
}

module.exports = app;
