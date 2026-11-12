/**
 * QuickKart: Quick-Commerce Management System
 * Users & Addresses Controller
 */

const { query } = require('../../config/database');

// List customer addresses
async function getAddresses(req, res) {
    try {
        const addresses = await query(
            'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
            [req.user.userId]
        );
        return res.json({ success: true, data: addresses });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

// Add a delivery address
async function addAddress(req, res) {
    try {
        const { addressLine, area, city = 'Chennai', state = 'Tamil Nadu', pincode, latitude, longitude, addressType = 'HOME', isDefault = false } = req.body;

        if (!addressLine || !area || !pincode) {
            return res.status(400).json({
                success: false,
                message: 'Address line, area, and pincode are required.'
            });
        }

        // If this address is set to default, reset other addresses for this user
        if (isDefault) {
            await query('UPDATE addresses SET is_default = FALSE WHERE user_id = ?', [req.user.userId]);
        }

        const result = await query(
            `INSERT INTO addresses (user_id, address_line, area, city, state, pincode, latitude, longitude, address_type, is_default)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.user.userId,
                addressLine.trim(),
                area.trim(),
                city.trim(),
                state.trim(),
                pincode.trim(),
                latitude || null,
                longitude || null,
                addressType,
                isDefault ? 1 : 0
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Address added successfully.',
            data: { addressId: result.insertId }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

// Delete an address
async function deleteAddress(req, res) {
    try {
        const addressId = req.params.id;
        await query('DELETE FROM addresses WHERE address_id = ? AND user_id = ?', [addressId, req.user.userId]);
        return res.json({ success: true, message: 'Address removed successfully.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

// List all users (Admin view)
async function getAllUsers(req, res) {
    try {
        const users = await query(
            `SELECT u.user_id, u.full_name, u.email, u.phone, u.account_status, u.created_at,
                    r.role_name
             FROM users u
             JOIN roles r ON u.role_id = r.role_id
             ORDER BY u.created_at DESC`
        );
        return res.json({ success: true, data: users });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    getAddresses,
    addAddress,
    deleteAddress,
    getAllUsers
};
