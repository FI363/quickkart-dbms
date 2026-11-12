/**
 * QuickKart: Quick-Commerce Management System
 * Database Configuration & Connection Pool
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQL_PWD || '',
    database: process.env.DB_NAME || 'quickkart_db',
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
    decimalNumbers: true,
    multipleStatements: true
};

const pool = mysql.createPool(dbConfig);

// Helper query function with automatic error logging
async function query(sql, params = []) {
    try {
        const [results] = await pool.query(sql, params);
        return results;
    } catch (error) {
        console.error('[DATABASE QUERY ERROR]', { sql: sql.slice(0, 100), message: error.message });
        throw error;
    }
}

// Test database connection
async function testConnection() {
    try {
        const [rows] = await pool.query('SELECT 1 + 1 AS result');
        console.log(`[DB CONNECTED] Connected to MySQL (${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database})`);
        return true;
    } catch (err) {
        console.warn(`[DB WARNING] Could not connect to MySQL: ${err.message}`);
        console.warn('  Ensure MySQL80 is running and DB_PASSWORD in .env is correct.');
        return false;
    }
}

module.exports = {
    pool,
    query,
    testConnection,
    dbConfig
};
