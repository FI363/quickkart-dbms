/**
 * QuickKart: Quick-Commerce Management System
 * Products & Catalogue Controller
 */

const { query } = require('../../config/database');

// Browse products with optional category, search, and storeId stock awareness
async function getProducts(req, res) {
    try {
        const { storeId, categoryId, search, limit = 50, offset = 0 } = req.query;

        // If storeId is provided, query vw_available_products for accurate localized stock
        if (storeId) {
            let sql = `
                SELECT * FROM vw_available_products
                WHERE store_id = ?
            `;
            const params = [parseInt(storeId, 10)];

            if (categoryId) {
                sql += ` AND (category_name = (SELECT category_name FROM categories WHERE category_id = ?) 
                          OR product_id IN (SELECT product_id FROM products WHERE category_id = ?))`;
                params.push(categoryId, categoryId);
            }

            if (search) {
                sql += ` AND (product_name LIKE ? OR brand_name LIKE ? OR variant_name LIKE ?)`;
                const term = `%${search.trim()}%`;
                params.push(term, term, term);
            }

            sql += ` ORDER BY category_name, product_name, price ASC`;
            const rows = await query(sql, params);

            // Group variants under their parent product for clean catalog rendering
            const productMap = new Map();
            for (const row of rows) {
                if (!productMap.has(row.product_id)) {
                    productMap.set(row.product_id, {
                        product_id: row.product_id,
                        product_name: row.product_name,
                        image_url: row.image_url,
                        category_name: row.category_name,
                        brand_name: row.brand_name,
                        store_id: row.store_id,
                        store_name: row.store_name,
                        store_area: row.store_area,
                        min_price: Number(row.price),
                        max_price: Number(row.price),
                        available_quantity: Number(row.available_quantity),
                        variants: []
                    });
                }
                const prod = productMap.get(row.product_id);
                prod.min_price = Math.min(prod.min_price, Number(row.price));
                prod.max_price = Math.max(prod.max_price, Number(row.price));
                prod.available_quantity = Math.max(prod.available_quantity, Number(row.available_quantity));
                prod.variants.push({
                    variant_id: row.variant_id,
                    product_id: row.product_id,
                    sku: row.sku,
                    variant_name: row.variant_name,
                    unit: row.unit,
                    price: Number(row.price),
                    mrp: Number(row.mrp),
                    total_quantity: Number(row.total_quantity),
                    reserved_quantity: Number(row.reserved_quantity),
                    available_quantity: Number(row.available_quantity),
                    stock_status: row.stock_status
                });
            }

            const products = Array.from(productMap.values());
            const paginated = products.slice(parseInt(offset, 10), parseInt(offset, 10) + parseInt(limit, 10));
            return res.json({ success: true, count: paginated.length, data: paginated });
        }

        // Generic catalogue browsing (aggregated across variants)
        let sql = `
            SELECT 
                p.product_id,
                p.product_name,
                p.description,
                p.image_url,
                p.is_active,
                c.category_id,
                c.category_name,
                b.brand_id,
                b.brand_name,
                MIN(v.price) AS min_price,
                MAX(v.price) AS max_price,
                COUNT(v.variant_id) AS variant_count
            FROM products p
            JOIN categories c ON p.category_id = c.category_id
            JOIN brands b ON p.brand_id = b.brand_id
            LEFT JOIN product_variants v ON p.product_id = v.product_id AND v.is_active = TRUE
            WHERE p.is_active = TRUE
        `;
        const params = [];

        if (categoryId) {
            sql += ` AND (p.category_id = ? OR c.parent_category_id = ?)`;
            params.push(categoryId, categoryId);
        }

        if (search) {
            sql += ` AND (p.product_name LIKE ? OR b.brand_name LIKE ?)`;
            const term = `%${search.trim()}%`;
            params.push(term, term);
        }

        sql += ` GROUP BY p.product_id, c.category_id, c.category_name, b.brand_id, b.brand_name
                 ORDER BY p.product_name ASC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit, 10), parseInt(offset, 10));

        const products = await query(sql, params);

        // Fetch variants for these products
        if (products.length > 0) {
            const productIds = products.map(p => p.product_id);
            const variants = await query(
                `SELECT * FROM product_variants WHERE product_id IN (?) AND is_active = TRUE`,
                [productIds]
            );

            const variantMap = {};
            variants.forEach(v => {
                if (!variantMap[v.product_id]) variantMap[v.product_id] = [];
                variantMap[v.product_id].push(v);
            });

            products.forEach(p => {
                p.variants = variantMap[p.product_id] || [];
            });
        }

        return res.json({ success: true, count: products.length, data: products });
    } catch (err) {
        console.error('Error in getProducts:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
}

// Get single product with all variants
async function getProductById(req, res) {
    try {
        const productId = req.params.id;
        const storeId = req.query.storeId;

        const products = await query(
            `SELECT p.*, c.category_name, b.brand_name
             FROM products p
             JOIN categories c ON p.category_id = c.category_id
             JOIN brands b ON p.brand_id = b.brand_id
             WHERE p.product_id = ?`,
            [productId]
        );

        if (products.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        const product = products[0];

        // Fetch variants
        let variantSql = 'SELECT * FROM product_variants WHERE product_id = ? AND is_active = TRUE';
        if (storeId) {
            variantSql = `
                SELECT v.*, 
                       COALESCE(i.total_quantity, 0) AS total_quantity,
                       COALESCE(i.reserved_quantity, 0) AS reserved_quantity,
                       fn_get_available_stock(?, v.variant_id) AS available_quantity
                FROM product_variants v
                LEFT JOIN store_inventory i ON i.variant_id = v.variant_id AND i.store_id = ?
                WHERE v.product_id = ? AND v.is_active = TRUE
            `;
            product.variants = await query(variantSql, [storeId, storeId, productId]);
        } else {
            product.variants = await query(variantSql, [productId]);
        }

        return res.json({ success: true, data: product });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

// Get hierarchical category list
async function getCategories(req, res) {
    try {
        const categories = await query('SELECT * FROM categories WHERE is_active = TRUE ORDER BY parent_category_id ASC, category_name ASC');

        // Organize into tree (root categories with subcategories)
        const rootCategories = categories.filter(c => c.parent_category_id === null);
        rootCategories.forEach(root => {
            root.subcategories = categories.filter(c => c.parent_category_id === root.category_id);
        });

        return res.json({ success: true, data: rootCategories });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    getProducts,
    getProductById,
    getCategories
};
