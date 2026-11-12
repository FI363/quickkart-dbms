-- ============================================================================
-- QuickKart: Quick-Commerce Management System
-- Script: 06_functions.sql
-- Description: Deterministic and reading functions for business logic:
--              available stock calculation, cart totals, Haversine geospatial
--              distance, and store service radius validation.
-- ============================================================================

USE quickkart_db;

-- ----------------------------------------------------------------------------
-- 1. fn_get_available_stock
-- Computes real-time available stock (Total - Reserved) for a variant at a hub.
-- Returns 0 if item is unstocked or if reserved exceeds total.
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS fn_get_available_stock;
DELIMITER $$
CREATE FUNCTION fn_get_available_stock(
    p_store_id BIGINT UNSIGNED,
    p_variant_id BIGINT UNSIGNED
) 
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_available INT DEFAULT 0;

    SELECT GREATEST(0, (total_quantity - reserved_quantity))
    INTO v_available
    FROM store_inventory
    WHERE store_id = p_store_id AND variant_id = p_variant_id;

    RETURN IFNULL(v_available, 0);
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 2. fn_calculate_cart_total
-- Computes aggregate subtotal of all items currently residing in a customer cart.
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS fn_calculate_cart_total;
DELIMITER $$
CREATE FUNCTION fn_calculate_cart_total(
    p_cart_id BIGINT UNSIGNED
) 
RETURNS DECIMAL(10, 2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_total DECIMAL(10, 2) DEFAULT 0.00;

    SELECT IFNULL(SUM(ci.quantity * pv.price), 0.00)
    INTO v_total
    FROM cart_items ci
    JOIN product_variants pv ON ci.variant_id = pv.variant_id
    WHERE ci.cart_id = p_cart_id;

    RETURN v_total;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 3. fn_haversine_distance
-- Calculates geographic surface distance in kilometers between two GPS coordinates
-- using the Haversine trigonometric formula (Mean Earth radius = 6371.0 km).
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS fn_haversine_distance;
DELIMITER $$
CREATE FUNCTION fn_haversine_distance(
    lat1 DECIMAL(10, 7),
    lon1 DECIMAL(10, 7),
    lat2 DECIMAL(10, 7),
    lon2 DECIMAL(10, 7)
) 
RETURNS DECIMAL(10, 3)
DETERMINISTIC
CONTAINS SQL
BEGIN
    DECLARE v_radius DECIMAL(10, 3) DEFAULT 6371.000; -- Earth radius in km
    DECLARE dLat DOUBLE;
    DECLARE dLon DOUBLE;
    DECLARE a DOUBLE;
    DECLARE c DOUBLE;
    DECLARE distance DECIMAL(10, 3);

    -- If any coordinate is missing, return NULL
    IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
        RETURN NULL;
    END IF;

    -- Coordinate deltas converted to radians
    SET dLat = RADIANS(lat2 - lat1);
    SET dLon = RADIANS(lon2 - lon1);

    -- Haversine formula calculation
    SET a = SIN(dLat / 2) * SIN(dLat / 2) +
            COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
            SIN(dLon / 2) * SIN(dLon / 2);
            
    SET c = 2 * ATAN2(SQRT(a), SQRT(1 - a));
    SET distance = ROUND(v_radius * c, 3);

    RETURN distance;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 4. fn_is_store_servicing_address
-- Validates if a customer delivery address falls within a dark store's SLA radius.
-- Returns 1 (TRUE) if serviceable, 0 (FALSE) otherwise.
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS fn_is_store_servicing_address;
DELIMITER $$
CREATE FUNCTION fn_is_store_servicing_address(
    p_store_id BIGINT UNSIGNED,
    p_address_id BIGINT UNSIGNED
) 
RETURNS BOOLEAN
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_store_lat DECIMAL(10, 7);
    DECLARE v_store_lon DECIMAL(10, 7);
    DECLARE v_radius DECIMAL(5, 2);
    DECLARE v_addr_lat DECIMAL(10, 7);
    DECLARE v_addr_lon DECIMAL(10, 7);
    DECLARE v_dist DECIMAL(10, 3);

    -- Fetch store location and coverage radius
    SELECT latitude, longitude, service_radius_km
    INTO v_store_lat, v_store_lon, v_radius
    FROM dark_stores
    WHERE store_id = p_store_id AND is_active = TRUE;

    -- Fetch customer address coordinates
    SELECT latitude, longitude
    INTO v_addr_lat, v_addr_lon
    FROM addresses
    WHERE address_id = p_address_id;

    -- If either has unmapped GPS coordinates, return FALSE
    IF v_store_lat IS NULL OR v_addr_lat IS NULL THEN
        RETURN FALSE;
    END IF;

    SET v_dist = fn_haversine_distance(v_store_lat, v_store_lon, v_addr_lat, v_addr_lon);

    IF v_dist IS NOT NULL AND v_dist <= v_radius THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END$$
DELIMITER ;

SELECT 'All 4 business logic functions created successfully!' AS Status;
