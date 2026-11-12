-- ============================================================================
-- QuickKart: Quick-Commerce Management System
-- Script: 08_triggers.sql
-- Description: Business and integrity enforcement triggers:
--              1. trg_validate_order_item: Auto-computes & verifies subtotal math
--              2. trg_order_status_history: Auto-logs state changes in orders
--              3. trg_delivery_status_history: Auto-logs delivery dispatch progress
--              4. trg_release_rider_on_delivered: Frees rider fleet on completion
--              5. trg_validate_cart_item_insert: Ensures non-zero cart quantities
-- ============================================================================

USE quickkart_db;

-- ----------------------------------------------------------------------------
-- 1. trg_validate_order_item
-- Enforces data integrity before order items are committed:
--  - Quantity must be strictly positive (> 0).
--  - Unit price must be non-negative (>= 0).
--  - Mathematically re-calculates subtotal = quantity * unit_price.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_validate_order_item;
DELIMITER $$
CREATE TRIGGER trg_validate_order_item
BEFORE INSERT ON order_items
FOR EACH ROW
BEGIN
    IF NEW.quantity <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Order item quantity must be strictly greater than zero.';
    END IF;

    IF NEW.unit_price < 0.00 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Order item unit price cannot be negative.';
    END IF;

    -- Ensure exact mathematical computation
    SET NEW.subtotal = ROUND(NEW.quantity * NEW.unit_price, 2);
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 2. trg_order_status_history
-- Automatically maintains an immutable timeline of every state transition
-- that an order undergoes (PENDING -> CONFIRMED -> PACKING -> OUT_FOR_DELIVERY -> DELIVERED).
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_order_status_history;
DELIMITER $$
CREATE TRIGGER trg_order_status_history
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    -- Only trigger if the order status actually changed
    IF OLD.order_status <> NEW.order_status THEN
        INSERT INTO order_status_history (
            order_id, 
            previous_status, 
            new_status, 
            changed_at, 
            remarks
        ) VALUES (
            NEW.order_id, 
            OLD.order_status, 
            NEW.order_status, 
            NOW(), 
            CONCAT('Order transition from ', OLD.order_status, ' to ', NEW.order_status)
        );
    END IF;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 3. trg_delivery_status_history
-- Automatically logs transitions in the delivery dispatch lifecycle.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_delivery_status_history;
DELIMITER $$
CREATE TRIGGER trg_delivery_status_history
AFTER UPDATE ON deliveries
FOR EACH ROW
BEGIN
    IF OLD.delivery_status <> NEW.delivery_status THEN
        INSERT INTO delivery_status_history (
            delivery_id, 
            status, 
            updated_at, 
            remarks
        ) VALUES (
            NEW.delivery_id, 
            NEW.delivery_status, 
            NOW(), 
            CONCAT('Delivery updated from ', OLD.delivery_status, ' to ', NEW.delivery_status)
        );
    END IF;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 4. trg_release_rider_on_delivered
-- When a delivery is marked DELIVERED or FAILED, automatically updates the
-- assigned rider's availability back to 'AVAILABLE' for the next trip.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_release_rider_on_delivered;
DELIMITER $$
CREATE TRIGGER trg_release_rider_on_delivered
AFTER UPDATE ON deliveries
FOR EACH ROW
BEGIN
    IF OLD.delivery_status <> NEW.delivery_status AND NEW.delivery_status IN ('DELIVERED', 'FAILED') THEN
        IF NEW.partner_id IS NOT NULL THEN
            UPDATE delivery_partners
            SET availability_status = 'AVAILABLE'
            WHERE partner_id = NEW.partner_id;
        END IF;
    END IF;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 5. trg_validate_cart_item_insert & update
-- Prevents non-positive item quantities entering cart sessions.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_validate_cart_item_insert;
DELIMITER $$
CREATE TRIGGER trg_validate_cart_item_insert
BEFORE INSERT ON cart_items
FOR EACH ROW
BEGIN
    IF NEW.quantity <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cart item quantity must be at least 1.';
    END IF;
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS trg_validate_cart_item_update;
DELIMITER $$
CREATE TRIGGER trg_validate_cart_item_update
BEFORE UPDATE ON cart_items
FOR EACH ROW
BEGIN
    IF NEW.quantity <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cart item quantity must be at least 1.';
    END IF;
END$$
DELIMITER ;

SELECT 'All database triggers created successfully!' AS Status;
