-- ============================================================================
-- QuickKart: Quick-Commerce Management System
-- Script: 07_procedures.sql
-- Description: Transaction-safe stored procedures managing critical enterprise
--              workflows (Checkout, Cancellation, Inventory Inward, Inter-Store
--              Transfer, Rider Dispatch, Expired Reservation Sweep).
-- Engine: InnoDB (Row locks with SELECT ... FOR UPDATE, COMMIT/ROLLBACK)
-- ============================================================================

USE quickkart_db;

-- ----------------------------------------------------------------------------
-- 1. sp_place_order
-- Transaction-safe atomic checkout workflow:
--  - Validates active cart items against dark store inventory.
--  - Employs pessimistic row locks (FOR UPDATE) to prevent overselling.
--  - Generates unique order number and immutable delivery address snapshot.
--  - Copies cart items to historical snapshot order items.
--  - Locks stock into reservations and adjusts store_inventory reserved count.
--  - Initializes payment record, delivery dispatch job, and status history.
--  - Converts active cart.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_place_order;
DELIMITER $$
CREATE PROCEDURE sp_place_order(
    IN p_user_id BIGINT UNSIGNED,
    IN p_store_id BIGINT UNSIGNED,
    IN p_address_id BIGINT UNSIGNED,
    IN p_payment_method VARCHAR(30),
    OUT p_order_id BIGINT UNSIGNED,
    OUT p_order_number VARCHAR(40),
    OUT p_status_code INT,
    OUT p_status_message VARCHAR(255)
)
proc_body: BEGIN
    DECLARE v_cart_id BIGINT UNSIGNED;
    DECLARE v_item_count INT DEFAULT 0;
    DECLARE v_subtotal DECIMAL(10, 2) DEFAULT 0.00;
    DECLARE v_delivery_fee DECIMAL(10, 2) DEFAULT 15.00;
    DECLARE v_discount DECIMAL(10, 2) DEFAULT 0.00;
    DECLARE v_total_amount DECIMAL(10, 2) DEFAULT 0.00;
    DECLARE v_address_snapshot TEXT;
    DECLARE v_txn_ref VARCHAR(100);
    DECLARE done INT DEFAULT FALSE;
    
    -- Cursor variables for cart items inspection
    DECLARE cur_variant_id BIGINT UNSIGNED;
    DECLARE cur_quantity INT;
    DECLARE cur_price DECIMAL(10, 2);
    DECLARE cur_prod_name VARCHAR(150);
    DECLARE cur_var_name VARCHAR(100);
    DECLARE cur_avail_stock INT;

    DECLARE cur_cart CURSOR FOR 
        SELECT 
            ci.variant_id, 
            ci.quantity, 
            pv.price, 
            p.product_name, 
            pv.variant_name
        FROM cart_items ci
        JOIN product_variants pv ON ci.variant_id = pv.variant_id
        JOIN products p ON pv.product_id = p.product_id
        WHERE ci.cart_id = v_cart_id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    -- Error handler for unexpected SQL exceptions
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_order_id = NULL;
        SET p_order_number = NULL;
        SET p_status_code = 500;
        SET p_status_message = 'Internal database transaction error during checkout. Order rolled back.';
    END;

    -- Default response values
    SET p_order_id = NULL;
    SET p_order_number = NULL;
    SET p_status_code = 200;
    SET p_status_message = 'Order placed successfully.';

    -- 1. Locate active cart for customer and store
    SELECT cart_id INTO v_cart_id
    FROM carts
    WHERE user_id = p_user_id AND store_id = p_store_id AND cart_status = 'ACTIVE'
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_cart_id IS NULL THEN
        SET p_status_code = 404;
        SET p_status_message = 'Active cart not found for this user and store.';
        LEAVE proc_body;
    END IF;

    -- Count items in cart
    SELECT COUNT(*) INTO v_item_count
    FROM cart_items
    WHERE cart_id = v_cart_id;

    IF v_item_count = 0 THEN
        SET p_status_code = 400;
        SET p_status_message = 'Cannot place an order with an empty cart.';
        LEAVE proc_body;
    END IF;

    -- 2. Build delivery address snapshot string
    SELECT CONCAT(address_line, ', ', area, ', ', city, ' - ', pincode)
    INTO v_address_snapshot
    FROM addresses
    WHERE address_id = p_address_id AND user_id = p_user_id;

    IF v_address_snapshot IS NULL THEN
        SET p_status_code = 400;
        SET p_status_message = 'Invalid delivery address specified for this customer.';
        LEAVE proc_body;
    END IF;

    -- START TRANSACTION WITH ROW LEVEL LOCKS
    START TRANSACTION;

    -- 3. Verify stock availability for each cart item with pessimistic locks
    OPEN cur_cart;
    stock_loop: LOOP
        FETCH cur_cart INTO cur_variant_id, cur_quantity, cur_price, cur_prod_name, cur_var_name;
        IF done THEN
            LEAVE stock_loop;
        END IF;

        -- Pessimistic row lock on store inventory
        SELECT (total_quantity - reserved_quantity)
        INTO cur_avail_stock
        FROM store_inventory
        WHERE store_id = p_store_id AND variant_id = cur_variant_id
        FOR UPDATE;

        IF cur_avail_stock IS NULL OR cur_avail_stock < cur_quantity THEN
            CLOSE cur_cart;
            ROLLBACK;
            SET p_status_code = 409;
            SET p_status_message = CONCAT('Insufficient stock for: ', cur_prod_name, ' (', cur_var_name, '). Available: ', IFNULL(cur_avail_stock, 0));
            LEAVE proc_body;
        END IF;

        SET v_subtotal = v_subtotal + (cur_price * cur_quantity);
    END LOOP;
    CLOSE cur_cart;

    -- Reset cursor flag
    SET done = FALSE;

    -- Apply free delivery threshold rule (e.g. Free delivery on orders >= Rs. 200)
    IF v_subtotal >= 200.00 THEN
        SET v_delivery_fee = 0.00;
    ELSE
        SET v_delivery_fee = 15.00;
    END IF;

    SET v_total_amount = v_subtotal + v_delivery_fee - v_discount;

    -- 4. Generate unique order number (ORD-YYYYMMDD-XXXXXX)
    SET p_order_number = CONCAT('ORD-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 900000 + 100000), 6, '0'));

    -- 5. Insert Master Order Record
    INSERT INTO orders (
        user_id, 
        store_id, 
        address_id, 
        order_number, 
        delivery_address_snapshot, 
        subtotal, 
        delivery_fee, 
        discount, 
        total_amount, 
        order_status, 
        created_at
    ) VALUES (
        p_user_id, 
        p_store_id, 
        p_address_id, 
        p_order_number, 
        v_address_snapshot, 
        v_subtotal, 
        v_delivery_fee, 
        v_discount, 
        v_total_amount, 
        'CONFIRMED', 
        NOW()
    );

    SET p_order_id = LAST_INSERT_ID();

    -- 6. Insert Order Items & Lock Stock into Reservations
    OPEN cur_cart;
    order_items_loop: LOOP
        FETCH cur_cart INTO cur_variant_id, cur_quantity, cur_price, cur_prod_name, cur_var_name;
        IF done THEN
            LEAVE order_items_loop;
        END IF;

        -- Insert line item snapshot
        INSERT INTO order_items (
            order_id, 
            variant_id, 
            product_name_snapshot, 
            variant_name_snapshot, 
            quantity, 
            unit_price, 
            subtotal
        ) VALUES (
            p_order_id, 
            cur_variant_id, 
            cur_prod_name, 
            cur_var_name, 
            cur_quantity, 
            cur_price, 
            (cur_price * cur_quantity)
        );

        -- Update reserved stock in inventory
        UPDATE store_inventory
        SET reserved_quantity = reserved_quantity + cur_quantity
        WHERE store_id = p_store_id AND variant_id = cur_variant_id;

        -- Record stock reservation with 15-minute SLA lock
        INSERT INTO stock_reservations (
            order_id, 
            variant_id, 
            store_id, 
            quantity, 
            reservation_status, 
            expires_at, 
            created_at
        ) VALUES (
            p_order_id, 
            cur_variant_id, 
            p_store_id, 
            cur_quantity, 
            'CONFIRMED', 
            DATE_ADD(NOW(), INTERVAL 15 MINUTE), 
            NOW()
        );
    END LOOP;
    CLOSE cur_cart;

    -- 7. Record Order Status History
    INSERT INTO order_status_history (order_id, previous_status, new_status, changed_at, remarks)
    VALUES (p_order_id, 'PENDING', 'CONFIRMED', NOW(), 'Order placed and payment authorized successfully.');

    -- 8. Record Payment Transaction
    SET v_txn_ref = CONCAT('TXN-', UPPER(p_payment_method), '-', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s'), '-', LPAD(FLOOR(RAND() * 9000 + 1000), 4, '0'));
    
    INSERT INTO payments (
        order_id, 
        transaction_reference, 
        payment_method, 
        amount, 
        payment_status, 
        paid_at, 
        created_at
    ) VALUES (
        p_order_id, 
        v_txn_ref, 
        p_payment_method, 
        v_total_amount, 
        IF(p_payment_method = 'COD', 'PENDING', 'SUCCESS'), 
        IF(p_payment_method = 'COD', NULL, NOW()), 
        NOW()
    );

    -- 9. Initialize Delivery Task
    INSERT INTO deliveries (
        order_id, 
        partner_id, 
        delivery_status, 
        estimated_delivery_time, 
        created_at
    ) VALUES (
        p_order_id, 
        NULL, 
        'PENDING_ASSIGNMENT', 
        DATE_ADD(NOW(), INTERVAL 20 MINUTE), 
        NOW()
    );

    -- 10. Mark Cart as Converted
    UPDATE carts
    SET cart_status = 'CONVERTED', updated_at = NOW()
    WHERE cart_id = v_cart_id;

    COMMIT;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 2. sp_cancel_order
-- Transaction-safe order cancellation & refund workflow:
--  - Validates order cancellability (cannot cancel if already OUT_FOR_DELIVERY or DELIVERED).
--  - Releases reserved inventory back to available stock.
--  - Updates stock reservations status to 'RELEASED'.
--  - Records audit inventory transaction log.
--  - Initiates/processes financial refund if payment was settled.
--  - Cancels associated delivery dispatch task.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_cancel_order;
DELIMITER $$
CREATE PROCEDURE sp_cancel_order(
    IN p_order_id BIGINT UNSIGNED,
    IN p_reason TEXT,
    OUT p_status_code INT,
    OUT p_status_message VARCHAR(255)
)
proc_body: BEGIN
    DECLARE v_current_status VARCHAR(30);
    DECLARE v_store_id BIGINT UNSIGNED;
    DECLARE v_payment_id BIGINT UNSIGNED;
    DECLARE v_paid_amount DECIMAL(10, 2);
    DECLARE v_payment_status VARCHAR(20);
    DECLARE v_refund_ref VARCHAR(100);
    DECLARE done INT DEFAULT FALSE;
    
    -- Cursor for releasing reservations
    DECLARE cur_var_id BIGINT UNSIGNED;
    DECLARE cur_res_qty INT;
    DECLARE cur_res CURSOR FOR 
        SELECT variant_id, quantity 
        FROM stock_reservations
        WHERE order_id = p_order_id AND reservation_status IN ('ACTIVE', 'CONFIRMED');

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status_code = 500;
        SET p_status_message = 'Database error occurred during order cancellation. Rollback executed.';
    END;

    SET p_status_code = 200;
    SET p_status_message = 'Order cancelled and stock released successfully.';

    START TRANSACTION;

    -- Check current order status
    SELECT order_status, store_id 
    INTO v_current_status, v_store_id
    FROM orders
    WHERE order_id = p_order_id
    FOR UPDATE;

    IF v_current_status IS NULL THEN
        ROLLBACK;
        SET p_status_code = 404;
        SET p_status_message = 'Order ID not found.';
        LEAVE proc_body;
    END IF;

    IF v_current_status IN ('OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED') THEN
        ROLLBACK;
        SET p_status_code = 400;
        SET p_status_message = CONCAT('Cannot cancel order in state: ', v_current_status);
        LEAVE proc_body;
    END IF;

    -- Update order status
    UPDATE orders
    SET order_status = 'CANCELLED', updated_at = NOW()
    WHERE order_id = p_order_id;

    -- Release reserved inventory back to available stock
    OPEN cur_res;
    release_loop: LOOP
        FETCH cur_res INTO cur_var_id, cur_res_qty;
        IF done THEN
            LEAVE release_loop;
        END IF;

        UPDATE store_inventory
        SET reserved_quantity = GREATEST(0, reserved_quantity - cur_res_qty)
        WHERE store_id = v_store_id AND variant_id = cur_var_id;

        -- Record inventory transaction audit
        INSERT INTO inventory_transactions (
            inventory_id, 
            transaction_type, 
            quantity_change, 
            previous_quantity, 
            new_quantity, 
            reference_id, 
            notes, 
            created_at
        ) 
        SELECT 
            inventory_id, 
            'ORDER_CANCELLED', 
            0, 
            total_quantity, 
            total_quantity, 
            p_order_id, 
            CONCAT('Reservation released due to order cancellation: ', p_reason), 
            NOW()
        FROM store_inventory
        WHERE store_id = v_store_id AND variant_id = cur_var_id;
    END LOOP;
    CLOSE cur_res;

    -- Update reservation status
    UPDATE stock_reservations
    SET reservation_status = 'RELEASED'
    WHERE order_id = p_order_id;

    -- Record Order Status History
    INSERT INTO order_status_history (order_id, previous_status, new_status, changed_at, remarks)
    VALUES (p_order_id, v_current_status, 'CANCELLED', NOW(), p_reason);

    -- Check if payment was made and process refund
    SELECT payment_id, amount, payment_status
    INTO v_payment_id, v_paid_amount, v_payment_status
    FROM payments
    WHERE order_id = p_order_id
    LIMIT 1;

    IF v_payment_id IS NOT NULL AND v_payment_status = 'SUCCESS' THEN
        SET v_refund_ref = CONCAT('RFND-', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s'), '-', LPAD(FLOOR(RAND() * 9000 + 1000), 4, '0'));
        
        UPDATE payments
        SET payment_status = 'REFUNDED'
        WHERE payment_id = v_payment_id;

        INSERT INTO refunds (
            payment_id, 
            refund_reference, 
            refund_amount, 
            refund_reason, 
            refund_status, 
            created_at, 
            processed_at
        ) VALUES (
            v_payment_id, 
            v_refund_ref, 
            v_paid_amount, 
            p_reason, 
            'PROCESSED', 
            NOW(), 
            NOW()
        );
    END IF;

    -- Cancel delivery task if pending
    UPDATE deliveries
    SET delivery_status = 'FAILED'
    WHERE order_id = p_order_id AND delivery_status IN ('PENDING_ASSIGNMENT', 'ASSIGNED');

    COMMIT;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 3. sp_add_inventory
-- Inward replenishment procedure for dark store inventory managers:
--  - Upserts inventory row (creates if first time, else increments total_quantity).
--  - Generates immutable inventory_transactions audit row.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_add_inventory;
DELIMITER $$
CREATE PROCEDURE sp_add_inventory(
    IN p_store_id BIGINT UNSIGNED,
    IN p_variant_id BIGINT UNSIGNED,
    IN p_quantity INT,
    IN p_notes TEXT,
    OUT p_status_code INT,
    OUT p_status_message VARCHAR(255)
)
proc_body: BEGIN
    DECLARE v_inventory_id BIGINT UNSIGNED;
    DECLARE v_prev_qty INT DEFAULT 0;
    DECLARE v_new_qty INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status_code = 500;
        SET p_status_message = 'Failed to replenish inventory. Transaction rolled back.';
    END;

    IF p_quantity <= 0 THEN
        SET p_status_code = 400;
        SET p_status_message = 'Restock quantity must be greater than zero.';
        LEAVE proc_body;
    END IF;

    START TRANSACTION;

    SELECT inventory_id, total_quantity
    INTO v_inventory_id, v_prev_qty
    FROM store_inventory
    WHERE store_id = p_store_id AND variant_id = p_variant_id
    FOR UPDATE;

    IF v_inventory_id IS NOT NULL THEN
        SET v_new_qty = v_prev_qty + p_quantity;
        
        UPDATE store_inventory
        SET total_quantity = v_new_qty, updated_at = NOW()
        WHERE inventory_id = v_inventory_id;
    ELSE
        SET v_prev_qty = 0;
        SET v_new_qty = p_quantity;

        INSERT INTO store_inventory (
            store_id, 
            variant_id, 
            total_quantity, 
            reserved_quantity, 
            reorder_level, 
            updated_at
        ) VALUES (
            p_store_id, 
            p_variant_id, 
            p_quantity, 
            0, 
            15, 
            NOW()
        );

        SET v_inventory_id = LAST_INSERT_ID();
    END IF;

    -- Record audit transaction
    INSERT INTO inventory_transactions (
        inventory_id, 
        transaction_type, 
        quantity_change, 
        previous_quantity, 
        new_quantity, 
        notes, 
        created_at
    ) VALUES (
        v_inventory_id, 
        'RESTOCK', 
        p_quantity, 
        v_prev_qty, 
        v_new_qty, 
        p_notes, 
        NOW()
    );

    COMMIT;
    SET p_status_code = 200;
    SET p_status_message = CONCAT('Successfully restocked ', p_quantity, ' units. New total: ', v_new_qty);
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 4. sp_transfer_inventory
-- Inter-dark-store stock rebalancing workflow:
--  - Validates distinct source and destination dark stores.
--  - Locks source inventory and checks available quantity.
--  - Decrements source inventory (TRANSFER_OUT).
--  - Increments destination inventory (TRANSFER_IN).
--  - Inserts stock_transfers manifest and line items.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_transfer_inventory;
DELIMITER $$
CREATE PROCEDURE sp_transfer_inventory(
    IN p_source_store_id BIGINT UNSIGNED,
    IN p_destination_store_id BIGINT UNSIGNED,
    IN p_variant_id BIGINT UNSIGNED,
    IN p_quantity INT,
    IN p_notes TEXT,
    OUT p_transfer_id BIGINT UNSIGNED,
    OUT p_status_code INT,
    OUT p_status_message VARCHAR(255)
)
proc_body: BEGIN
    DECLARE v_src_inv_id BIGINT UNSIGNED;
    DECLARE v_dest_inv_id BIGINT UNSIGNED;
    DECLARE v_src_total INT;
    DECLARE v_src_reserved INT;
    DECLARE v_src_avail INT;
    DECLARE v_dest_total INT DEFAULT 0;
    DECLARE v_transfer_number VARCHAR(40);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_transfer_id = NULL;
        SET p_status_code = 500;
        SET p_status_message = 'Failed to execute stock transfer. Transaction rolled back.';
    END;

    SET p_transfer_id = NULL;

    IF p_source_store_id = p_destination_store_id THEN
        SET p_status_code = 400;
        SET p_status_message = 'Source and destination dark stores must be distinct.';
        LEAVE proc_body;
    END IF;

    IF p_quantity <= 0 THEN
        SET p_status_code = 400;
        SET p_status_message = 'Transfer quantity must be greater than zero.';
        LEAVE proc_body;
    END IF;

    START TRANSACTION;

    -- Lock and check source store inventory
    SELECT inventory_id, total_quantity, reserved_quantity
    INTO v_src_inv_id, v_src_total, v_src_reserved
    FROM store_inventory
    WHERE store_id = p_source_store_id AND variant_id = p_variant_id
    FOR UPDATE;

    IF v_src_inv_id IS NULL THEN
        ROLLBACK;
        SET p_status_code = 404;
        SET p_status_message = 'Item is not stocked at source dark store.';
        LEAVE proc_body;
    END IF;

    SET v_src_avail = v_src_total - v_src_reserved;

    IF v_src_avail < p_quantity THEN
        ROLLBACK;
        SET p_status_code = 409;
        SET p_status_message = CONCAT('Insufficient unreserved stock at source store. Available: ', v_src_avail, ', Requested: ', p_quantity);
        LEAVE proc_body;
    END IF;

    -- Decrement source inventory
    UPDATE store_inventory
    SET total_quantity = total_quantity - p_quantity, updated_at = NOW()
    WHERE inventory_id = v_src_inv_id;

    -- Log transfer out audit
    INSERT INTO inventory_transactions (
        inventory_id, 
        transaction_type, 
        quantity_change, 
        previous_quantity, 
        new_quantity, 
        notes, 
        created_at
    ) VALUES (
        v_src_inv_id, 
        'TRANSFER_OUT', 
        -p_quantity, 
        v_src_total, 
        (v_src_total - p_quantity), 
        CONCAT('Transfer to Store #', p_destination_store_id, ': ', p_notes), 
        NOW()
    );

    -- Lock / create destination inventory
    SELECT inventory_id, total_quantity
    INTO v_dest_inv_id, v_dest_total
    FROM store_inventory
    WHERE store_id = p_destination_store_id AND variant_id = p_variant_id
    FOR UPDATE;

    IF v_dest_inv_id IS NOT NULL THEN
        UPDATE store_inventory
        SET total_quantity = total_quantity + p_quantity, updated_at = NOW()
        WHERE inventory_id = v_dest_inv_id;
    ELSE
        INSERT INTO store_inventory (
            store_id, 
            variant_id, 
            total_quantity, 
            reserved_quantity, 
            reorder_level, 
            updated_at
        ) VALUES (
            p_destination_store_id, 
            p_variant_id, 
            p_quantity, 
            0, 
            15, 
            NOW()
        );
        SET v_dest_inv_id = LAST_INSERT_ID();
        SET v_dest_total = 0;
    END IF;

    -- Log transfer in audit
    INSERT INTO inventory_transactions (
        inventory_id, 
        transaction_type, 
        quantity_change, 
        previous_quantity, 
        new_quantity, 
        notes, 
        created_at
    ) VALUES (
        v_dest_inv_id, 
        'TRANSFER_IN', 
        p_quantity, 
        v_dest_total, 
        (v_dest_total + p_quantity), 
        CONCAT('Transfer from Store #', p_source_store_id, ': ', p_notes), 
        NOW()
    );

    -- Create transfer manifest record
    SET v_transfer_number = CONCAT('TRF-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 9000 + 1000), 4, '0'));

    INSERT INTO stock_transfers (
        transfer_number, 
        source_store_id, 
        destination_store_id, 
        transfer_status, 
        created_at, 
        completed_at, 
        notes
    ) VALUES (
        v_transfer_number, 
        p_source_store_id, 
        p_destination_store_id, 
        'COMPLETED', 
        NOW(), 
        NOW(), 
        p_notes
    );

    SET p_transfer_id = LAST_INSERT_ID();

    INSERT INTO stock_transfer_items (transfer_id, variant_id, quantity)
    VALUES (p_transfer_id, p_variant_id, p_quantity);

    COMMIT;
    SET p_status_code = 200;
    SET p_status_message = CONCAT('Transfer ', v_transfer_number, ' completed successfully.');
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 5. sp_assign_delivery
-- Dispatches a delivery rider to an order ready at a hub:
--  - Verifies rider availability (must be 'AVAILABLE').
--  - Sets partner to 'BUSY'.
--  - Transitions delivery status to 'ASSIGNED'.
--  - Updates order status to 'OUT_FOR_DELIVERY'.
--  - Writes delivery status history audit entry.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_assign_delivery;
DELIMITER $$
CREATE PROCEDURE sp_assign_delivery(
    IN p_order_id BIGINT UNSIGNED,
    IN p_partner_id BIGINT UNSIGNED,
    OUT p_status_code INT,
    OUT p_status_message VARCHAR(255)
)
proc_body: BEGIN
    DECLARE v_delivery_id BIGINT UNSIGNED;
    DECLARE v_avail_status VARCHAR(20);
    DECLARE v_order_status VARCHAR(30);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status_code = 500;
        SET p_status_message = 'Failed to assign delivery rider. Transaction rolled back.';
    END;

    START TRANSACTION;

    -- Validate rider availability
    SELECT availability_status INTO v_avail_status
    FROM delivery_partners
    WHERE partner_id = p_partner_id
    FOR UPDATE;

    IF v_avail_status IS NULL THEN
        ROLLBACK;
        SET p_status_code = 404;
        SET p_status_message = 'Delivery partner not found.';
        LEAVE proc_body;
    END IF;

    IF v_avail_status != 'AVAILABLE' THEN
        ROLLBACK;
        SET p_status_code = 409;
        SET p_status_message = CONCAT('Rider is currently: ', v_avail_status, '. Only AVAILABLE riders can be assigned.');
        LEAVE proc_body;
    END IF;

    -- Validate delivery task
    SELECT delivery_id INTO v_delivery_id
    FROM deliveries
    WHERE order_id = p_order_id
    FOR UPDATE;

    IF v_delivery_id IS NULL THEN
        ROLLBACK;
        SET p_status_code = 404;
        SET p_status_message = 'No delivery record found for this order.';
        LEAVE proc_body;
    END IF;

    -- Update delivery record
    UPDATE deliveries
    SET 
        partner_id = p_partner_id,
        delivery_status = 'ASSIGNED',
        assigned_at = NOW(),
        estimated_delivery_time = DATE_ADD(NOW(), INTERVAL 15 MINUTE),
        updated_at = NOW()
    WHERE delivery_id = v_delivery_id;

    -- Update rider status to BUSY
    UPDATE delivery_partners
    SET availability_status = 'BUSY'
    WHERE partner_id = p_partner_id;

    -- Update order status
    SELECT order_status INTO v_order_status FROM orders WHERE order_id = p_order_id;

    UPDATE orders
    SET order_status = 'OUT_FOR_DELIVERY', updated_at = NOW()
    WHERE order_id = p_order_id;

    -- Audit history
    INSERT INTO delivery_status_history (delivery_id, status, updated_at, remarks)
    VALUES (v_delivery_id, 'ASSIGNED', NOW(), CONCAT('Dispatched to rider #', p_partner_id));

    INSERT INTO order_status_history (order_id, previous_status, new_status, changed_at, remarks)
    VALUES (p_order_id, v_order_status, 'OUT_FOR_DELIVERY', NOW(), CONCAT('Assigned to rider partner #', p_partner_id));

    COMMIT;
    SET p_status_code = 200;
    SET p_status_message = 'Delivery partner successfully assigned and order marked OUT_FOR_DELIVERY.';
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 6. sp_release_expired_reservations
-- Maintenance cron / background event procedure:
--  - Finds all stock_reservations past their expires_at deadline that remain ACTIVE.
--  - Releases reserved inventory back to available stock.
--  - Marks reservation status as 'EXPIRED'.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_release_expired_reservations;
DELIMITER $$
CREATE PROCEDURE sp_release_expired_reservations(
    OUT p_released_count INT
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_res_id BIGINT UNSIGNED;
    DECLARE v_store_id BIGINT UNSIGNED;
    DECLARE v_variant_id BIGINT UNSIGNED;
    DECLARE v_qty INT;
    DECLARE v_count INT DEFAULT 0;

    DECLARE cur_exp CURSOR FOR
        SELECT reservation_id, store_id, variant_id, quantity
        FROM stock_reservations
        WHERE reservation_status = 'ACTIVE' AND expires_at < NOW();

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    START TRANSACTION;

    OPEN cur_exp;
    exp_loop: LOOP
        FETCH cur_exp INTO v_res_id, v_store_id, v_variant_id, v_qty;
        IF done THEN
            LEAVE exp_loop;
        END IF;

        -- Release reserved stock in store inventory
        UPDATE store_inventory
        SET reserved_quantity = GREATEST(0, reserved_quantity - v_qty)
        WHERE store_id = v_store_id AND variant_id = v_variant_id;

        -- Mark reservation as expired
        UPDATE stock_reservations
        SET reservation_status = 'EXPIRED'
        WHERE reservation_id = v_res_id;

        SET v_count = v_count + 1;
    END LOOP;
    CLOSE cur_exp;

    COMMIT;
    SET p_released_count = v_count;
END$$
DELIMITER ;

SELECT 'All 6 enterprise stored procedures created successfully!' AS Status;
