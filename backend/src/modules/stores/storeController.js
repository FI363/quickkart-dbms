/**
 * QuickKart: Quick-Commerce Management System
 * Dark Stores Controller
 */

const { query } = require('../../config/database');

// List all active dark stores
async function getAllStores(req, res) {
    try {
        const stores = await query(
            'SELECT * FROM dark_stores WHERE is_active = TRUE ORDER BY store_name ASC'
        );
        return res.json({ success: true, count: stores.length, data: stores });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

// Find nearby dark store within service radius
async function getNearbyStore(req, res) {
    try {
        const { lat, lon, addressId } = req.query;

        let userLat = lat ? parseFloat(lat) : null;
        let userLon = lon ? parseFloat(lon) : null;

        if (addressId) {
            const addrs = await query('SELECT latitude, longitude FROM addresses WHERE address_id = ?', [addressId]);
            if (addrs.length > 0 && addrs[0].latitude) {
                userLat = parseFloat(addrs[0].latitude);
                userLon = parseFloat(addrs[0].longitude);
            }
        }

        // Default to Chennai center coordinates if GPS coordinates unavailable
        if (!userLat || !userLon) {
            userLat = 13.0418;
            userLon = 80.2341;
        }

        // Query dark stores calculated with fn_haversine_distance
        const stores = await query(
            `SELECT 
                store_id, 
                store_name, 
                address, 
                area, 
                city, 
                pincode, 
                latitude, 
                longitude, 
                service_radius_km, 
                fn_haversine_distance(latitude, longitude, ?, ?) AS distance_km
             FROM dark_stores
             WHERE is_active = TRUE
             ORDER BY distance_km ASC`,
            [userLat, userLon]
        );

        if (stores.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No active dark stores found in this region.'
            });
        }

        const nearest = stores[0];
        const isServiced = nearest.distance_km <= nearest.service_radius_km;

        return res.json({
            success: true,
            data: {
                nearestStore: nearest,
                isServiced,
                allStores: stores
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

// Get single store details
async function getStoreById(req, res) {
    try {
        const storeId = req.params.id;
        const stores = await query('SELECT * FROM dark_stores WHERE store_id = ?', [storeId]);
        if (stores.length === 0) {
            return res.status(404).json({ success: false, message: 'Store not found.' });
        }
        return res.json({ success: true, data: stores[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    getAllStores,
    getNearbyStore,
    getStoreById
};
