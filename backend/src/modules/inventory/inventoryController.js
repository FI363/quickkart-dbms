/**
 * QuickKart: Quick-Commerce Management System
 * Inventory Management Controller
 */

const { query } = require('../../config/database');

// Get all inventory items for a specific store
async function getStoreInventory(req, res) {
    try {
        const storeId = req.params.storeId;
        const inventory = await query(
            `SELECT * FROM vw_available_products
             WHERE store_id = ?
             ORDER BY category_name, product_name`,
            [storeId]
        );
        return res.json({ success: true, count: inventory.length, data: inventory });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

// Get low stock alert report (via vw_low_stock)
async function getLowStock(req, res) {
    try {
        const storeId = req.query.storeId;
        let sql = 'SELECT * FROM vw_low_stock';
        const params = [];

        if (storeId) {
            sql += ' WHERE store_id = ?';
            params.push(storeId);
        }

        const lowStock = await query(sql, params);
        return res.json({ success: true, count: lowStock.length, data: lowStock });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

// Inward restock procedure (calls sp_add_inventory)
async function restockItem(req, res) {
    try {
        const { storeId, variantId, quantity, notes = 'Manual manager restock' } = req.body;

        if (!storeId || !variantId || !quantity || quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'storeId, variantId, and positive quantity are required.'
            });
        }

        // Call stored procedure with single multi-statement to guarantee same connection session
        const results = await query(
            `CALL sp_add_inventory(?, ?, ?, ?, @p_status_code, @p_status_message);
             SELECT @p_status_code AS statusCode, @p_status_message AS message;`,
            [storeId, variantId, quantity, notes]
        );

        const selectRes = Array.isArray(results[1]) ? results[1] : (Array.isArray(results[results.length - 1]) ? results[results.length - 1] : []);
        const { statusCode = 200, message = 'Stock updated successfully.' } = selectRes[0] || {};

        if (statusCode && statusCode !== 200) {
            return res.status(statusCode).json({ success: false, message });
        }

        return res.json({ success: true, message });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

// Inter-store stock transfer (calls sp_transfer_inventory)
async function transferStock(req, res) {
    try {
        const { sourceStoreId, destinationStoreId, variantId, quantity, notes = 'Inter-store transfer' } = req.body;

        if (!sourceStoreId || !destinationStoreId || !variantId || !quantity || quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'sourceStoreId, destinationStoreId, variantId, and positive quantity are required.'
            });
        }

        const results = await query(
            `CALL sp_transfer_inventory(?, ?, ?, ?, ?, @p_transfer_id, @p_status_code, @p_status_message);
             SELECT @p_transfer_id AS transferId, @p_status_code AS statusCode, @p_status_message AS message;`,
            [sourceStoreId, destinationStoreId, variantId, quantity, notes]
        );

        const selectRes = Array.isArray(results[1]) ? results[1] : (Array.isArray(results[results.length - 1]) ? results[results.length - 1] : []);
        const { transferId, statusCode = 200, message = 'Transfer processed successfully.' } = selectRes[0] || {};

        if (statusCode && statusCode !== 200) {
            return res.status(statusCode).json({ success: false, message });
        }

        return res.json({
            success: true,
            message,
            data: { transferId }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

// Audit transaction logs
async function getInventoryTransactions(req, res) {
    try {
        const { storeId, limit = 50 } = req.query;
        let sql = `
            SELECT 
                t.*,
                s.store_name,
                p.product_name,
                v.variant_name,
                v.sku
            FROM inventory_transactions t
            JOIN store_inventory i ON t.inventory_id = i.inventory_id
            JOIN dark_stores s ON i.store_id = s.store_id
            JOIN product_variants v ON i.variant_id = v.variant_id
            JOIN products p ON v.product_id = p.product_id
        `;
        const params = [];

        if (storeId) {
            sql += ' WHERE i.store_id = ?';
            params.push(storeId);
        }

        sql += ' ORDER BY t.created_at DESC LIMIT ?';
        params.push(parseInt(limit, 10));

        const transactions = await query(sql, params);
        return res.json({ success: true, data: transactions });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    getStoreInventory,
    getLowStock,
    restockItem,
    transferStock,
    getInventoryTransactions
};
