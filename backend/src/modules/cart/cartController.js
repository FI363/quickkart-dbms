/**
 * QuickKart: Quick-Commerce Management System
 * Shopping Cart Controller
 */

const { query } = require('../../config/database');

// Get active cart for current user
async function getCart(req, res) {
    try {
        const userId = req.user.userId;
        const { storeId } = req.query;

        // Find active cart
        let cartSql = 'SELECT * FROM carts WHERE user_id = ? AND cart_status = "ACTIVE"';
        const params = [userId];

        if (storeId) {
            cartSql += ' AND store_id = ?';
            params.push(storeId);
        }

        cartSql += ' ORDER BY created_at DESC LIMIT 1';

        const carts = await query(cartSql, params);

        if (carts.length === 0) {
            return res.json({
                success: true,
                data: {
                    cartId: null,
                    items: [],
                    subtotal: 0.00,
                    deliveryFee: 15.00,
                    totalAmount: 15.00
                }
            });
        }

        const cart = carts[0];

        // Fetch cart items
        const items = await query(
            `SELECT 
                ci.cart_item_id,
                ci.quantity,
                v.variant_id,
                v.sku,
                v.variant_name,
                v.unit,
                v.price,
                v.mrp,
                p.product_id,
                p.product_name,
                p.image_url,
                b.brand_name,
                ROUND(ci.quantity * v.price, 2) AS item_subtotal,
                fn_get_available_stock(?, v.variant_id) AS available_stock
             FROM cart_items ci
             JOIN product_variants v ON ci.variant_id = v.variant_id
             JOIN products p ON v.product_id = p.product_id
             JOIN brands b ON p.brand_id = b.brand_id
             WHERE ci.cart_id = ?`,
            [cart.store_id, cart.cart_id]
        );

        // Calculate subtotal using stored function fn_calculate_cart_total
        const totalRes = await query('SELECT fn_calculate_cart_total(?) AS subtotal', [cart.cart_id]);
        const subtotal = parseFloat(totalRes[0].subtotal) || 0.00;
        const deliveryFee = subtotal >= 200.00 || subtotal === 0 ? 0.00 : 15.00;
        const totalAmount = subtotal + deliveryFee;

        return res.json({
            success: true,
            data: {
                cartId: cart.cart_id,
                storeId: cart.store_id,
                items,
                subtotal,
                deliveryFee,
                totalAmount
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

// Add or update cart item
async function addItem(req, res) {
    try {
        const userId = req.user.userId;
        const { storeId, variantId, quantity = 1 } = req.body;

        if (!storeId || !variantId) {
            return res.status(400).json({
                success: false,
                message: 'storeId and variantId are required.'
            });
        }

        if (quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be at least 1.'
            });
        }

        // Check available stock first via fn_get_available_stock
        const stockRes = await query('SELECT fn_get_available_stock(?, ?) AS available', [storeId, variantId]);
        const available = stockRes[0].available || 0;

        if (available < quantity) {
            return res.status(409).json({
                success: false,
                message: `Insufficient stock. Only ${available} units available.`
            });
        }

        // Find or create active cart for this user and store
        let carts = await query(
            'SELECT cart_id FROM carts WHERE user_id = ? AND store_id = ? AND cart_status = "ACTIVE"',
            [userId, storeId]
        );

        let cartId;
        if (carts.length > 0) {
            cartId = carts[0].cart_id;
        } else {
            const newCart = await query(
                'INSERT INTO carts (user_id, store_id, cart_status) VALUES (?, ?, "ACTIVE")',
                [userId, storeId]
            );
            cartId = newCart.insertId;
        }

        // Upsert cart item
        await query(
            `INSERT INTO cart_items (cart_id, variant_id, quantity)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE quantity = ?, updated_at = NOW()`,
            [cartId, variantId, quantity, quantity]
        );

        return res.json({
            success: true,
            message: 'Cart updated successfully.',
            data: { cartId, variantId, quantity }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

// Remove item from cart
async function removeItem(req, res) {
    try {
        const userId = req.user.userId;
        const variantId = req.params.variantId;

        // Locate active cart
        const carts = await query(
            'SELECT cart_id FROM carts WHERE user_id = ? AND cart_status = "ACTIVE"',
            [userId]
        );

        if (carts.length > 0) {
            await query(
                'DELETE FROM cart_items WHERE cart_id = ? AND variant_id = ?',
                [carts[0].cart_id, variantId]
            );
        }

        return res.json({ success: true, message: 'Item removed from cart.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

// Clear entire active cart
async function clearCart(req, res) {
    try {
        const userId = req.user.userId;
        const carts = await query(
            'SELECT cart_id FROM carts WHERE user_id = ? AND cart_status = "ACTIVE"',
            [userId]
        );

        if (carts.length > 0) {
            await query('DELETE FROM cart_items WHERE cart_id = ?', [carts[0].cart_id]);
        }

        return res.json({ success: true, message: 'Cart cleared successfully.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    getCart,
    addItem,
    removeItem,
    clearCart
};
