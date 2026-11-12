-- ============================================================================
-- QuickKart: Quick-Commerce Management System
-- Script: 02_create_tables.sql
-- Description: Creates all 23 core tables across 8 logical domains in 3NF
-- Engine: InnoDB (Full ACID, FK enforcement, row locking support)
-- ============================================================================

USE quickkart_db;

-- ----------------------------------------------------------------------------
-- DOMAIN A: IDENTITY & ACCESS MANAGEMENT
-- ----------------------------------------------------------------------------

-- Table 1: roles
CREATE TABLE IF NOT EXISTS roles (
    role_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(30) NOT NULL,
    description VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_roles_name UNIQUE (role_name),
    CONSTRAINT chk_roles_name CHECK (role_name IN ('CUSTOMER', 'ADMIN', 'STORE_MANAGER', 'DELIVERY_PARTNER'))
) ENGINE=InnoDB COMMENT='System roles for Role-Based Access Control (RBAC)';

-- Table 2: users
CREATE TABLE IF NOT EXISTS users (
    user_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT UNSIGNED NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    account_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT uq_users_phone UNIQUE (phone),
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) 
        REFERENCES roles(role_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_users_status CHECK (account_status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED'))
) ENGINE=InnoDB COMMENT='User credentials and account states';

-- Table 3: addresses
CREATE TABLE IF NOT EXISTS addresses (
    address_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    address_line VARCHAR(255) NOT NULL,
    area VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Chennai',
    state VARCHAR(50) NOT NULL DEFAULT 'Tamil Nadu',
    pincode VARCHAR(10) NOT NULL,
    latitude DECIMAL(10, 7) NULL,
    longitude DECIMAL(10, 7) NULL,
    address_type VARCHAR(20) NOT NULL DEFAULT 'HOME',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_address_type CHECK (address_type IN ('HOME', 'WORK', 'OTHER'))
) ENGINE=InnoDB COMMENT='Customer delivery addresses';

-- ----------------------------------------------------------------------------
-- DOMAIN B: PRODUCT CATALOGUE
-- ----------------------------------------------------------------------------

-- Table 4: categories
CREATE TABLE IF NOT EXISTS categories (
    category_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    parent_category_id BIGINT UNSIGNED NULL,
    category_name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    description TEXT NULL,
    image_url VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_categories_slug UNIQUE (slug),
    CONSTRAINT fk_categories_parent FOREIGN KEY (parent_category_id) 
        REFERENCES categories(category_id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Hierarchical product category taxonomy';

-- Table 5: brands
CREATE TABLE IF NOT EXISTS brands (
    brand_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    brand_name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    logo_url VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_brands_name UNIQUE (brand_name)
) ENGINE=InnoDB COMMENT='Product manufacturer brands';

-- Table 6: products
CREATE TABLE IF NOT EXISTS products (
    product_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT UNSIGNED NOT NULL,
    brand_id BIGINT UNSIGNED NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    image_url VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) 
        REFERENCES categories(category_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) 
        REFERENCES brands(brand_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Master product entities (independent of store and stock)';

-- Table 7: product_variants
CREATE TABLE IF NOT EXISTS product_variants (
    variant_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL,
    sku VARCHAR(50) NOT NULL,
    variant_name VARCHAR(100) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    mrp DECIMAL(10, 2) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_variants_sku UNIQUE (sku),
    CONSTRAINT fk_variants_product FOREIGN KEY (product_id) 
        REFERENCES products(product_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_variant_price CHECK (price >= 0),
    CONSTRAINT chk_variant_mrp CHECK (mrp IS NULL OR mrp >= price)
) ENGINE=InnoDB COMMENT='Specific stock-keeping units (SKUs) with weight/volume units and pricing';

-- ----------------------------------------------------------------------------
-- DOMAIN C: DARK STORES & INVENTORY MANAGEMENT
-- ----------------------------------------------------------------------------

-- Table 8: dark_stores
CREATE TABLE IF NOT EXISTS dark_stores (
    store_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    store_name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    area VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Chennai',
    pincode VARCHAR(10) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    service_radius_km DECIMAL(5, 2) NOT NULL DEFAULT 5.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_store_radius CHECK (service_radius_km > 0)
) ENGINE=InnoDB COMMENT='Micro-fulfillment hubs / dark stores serving specific geospatial radii';

-- Table 9: store_inventory
CREATE TABLE IF NOT EXISTS store_inventory (
    inventory_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    store_id BIGINT UNSIGNED NOT NULL,
    variant_id BIGINT UNSIGNED NOT NULL,
    total_quantity INT NOT NULL DEFAULT 0,
    reserved_quantity INT NOT NULL DEFAULT 0,
    reorder_level INT NOT NULL DEFAULT 10,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_store_variant UNIQUE (store_id, variant_id),
    CONSTRAINT fk_inventory_store FOREIGN KEY (store_id) 
        REFERENCES dark_stores(store_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_inventory_variant FOREIGN KEY (variant_id) 
        REFERENCES product_variants(variant_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_inventory_qty_non_negative CHECK (total_quantity >= 0),
    CONSTRAINT chk_inventory_reserved_non_negative CHECK (reserved_quantity >= 0),
    CONSTRAINT chk_inventory_reserved_le_total CHECK (reserved_quantity <= total_quantity),
    CONSTRAINT chk_inventory_reorder_non_negative CHECK (reorder_level >= 0)
) ENGINE=InnoDB COMMENT='Store-specific inventory levels with strict available/reserved stock separation';

-- Table 10: inventory_transactions
CREATE TABLE IF NOT EXISTS inventory_transactions (
    transaction_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    inventory_id BIGINT UNSIGNED NOT NULL,
    transaction_type VARCHAR(30) NOT NULL,
    quantity_change INT NOT NULL,
    previous_quantity INT NOT NULL,
    new_quantity INT NOT NULL,
    reference_id BIGINT UNSIGNED NULL,
    notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inv_tx_inventory FOREIGN KEY (inventory_id) 
        REFERENCES store_inventory(inventory_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_inv_tx_type CHECK (transaction_type IN (
        'RESTOCK', 
        'ORDER_RESERVED', 
        'ORDER_FULFILLED', 
        'ORDER_CANCELLED', 
        'TRANSFER_IN', 
        'TRANSFER_OUT', 
        'DAMAGE_ADJUSTMENT', 
        'AUDIT_CORRECTION'
    ))
) ENGINE=InnoDB COMMENT='Complete immutable audit trail for every inventory balance modification';

-- ----------------------------------------------------------------------------
-- DOMAIN D: SHOPPING CARTS & ORDER MANAGEMENT
-- ----------------------------------------------------------------------------

-- Table 11: carts
CREATE TABLE IF NOT EXISTS carts (
    cart_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    store_id BIGINT UNSIGNED NOT NULL,
    cart_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_carts_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_carts_store FOREIGN KEY (store_id) 
        REFERENCES dark_stores(store_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_cart_status CHECK (cart_status IN ('ACTIVE', 'ABANDONED', 'CONVERTED'))
) ENGINE=InnoDB COMMENT='Customer shopping carts tethered to a specific dark store';

-- Table 12: cart_items
CREATE TABLE IF NOT EXISTS cart_items (
    cart_item_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cart_id BIGINT UNSIGNED NOT NULL,
    variant_id BIGINT UNSIGNED NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_cart_variant UNIQUE (cart_id, variant_id),
    CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) 
        REFERENCES carts(cart_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_cart_items_variant FOREIGN KEY (variant_id) 
        REFERENCES product_variants(variant_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_cart_item_qty CHECK (quantity > 0)
) ENGINE=InnoDB COMMENT='Line items inside active customer carts';

-- Table 13: orders
CREATE TABLE IF NOT EXISTS orders (
    order_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    store_id BIGINT UNSIGNED NOT NULL,
    address_id BIGINT UNSIGNED NOT NULL,
    order_number VARCHAR(40) NOT NULL,
    delivery_address_snapshot TEXT NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    order_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_orders_number UNIQUE (order_number),
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_orders_store FOREIGN KEY (store_id) 
        REFERENCES dark_stores(store_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_orders_address FOREIGN KEY (address_id) 
        REFERENCES addresses(address_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_orders_subtotal CHECK (subtotal >= 0),
    CONSTRAINT chk_orders_delivery_fee CHECK (delivery_fee >= 0),
    CONSTRAINT chk_orders_discount CHECK (discount >= 0),
    CONSTRAINT chk_orders_total CHECK (total_amount >= 0),
    CONSTRAINT chk_orders_status CHECK (order_status IN (
        'PENDING', 
        'CONFIRMED', 
        'PACKING', 
        'OUT_FOR_DELIVERY', 
        'DELIVERED', 
        'CANCELLED'
    ))
) ENGINE=InnoDB COMMENT='Master order transactions with immutable address snapshot';

-- Table 14: order_items
CREATE TABLE IF NOT EXISTS order_items (
    order_item_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    variant_id BIGINT UNSIGNED NOT NULL,
    product_name_snapshot VARCHAR(150) NOT NULL,
    variant_name_snapshot VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) 
        REFERENCES orders(order_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_order_items_variant FOREIGN KEY (variant_id) 
        REFERENCES product_variants(variant_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_order_item_qty CHECK (quantity > 0),
    CONSTRAINT chk_order_item_price CHECK (unit_price >= 0),
    CONSTRAINT chk_order_item_subtotal CHECK (subtotal >= 0)
) ENGINE=InnoDB COMMENT='Immutable historical line items with name and price snapshot';

-- Table 15: order_status_history
CREATE TABLE IF NOT EXISTS order_status_history (
    history_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    previous_status VARCHAR(30) NULL,
    new_status VARCHAR(30) NOT NULL,
    changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT NULL,
    CONSTRAINT fk_order_history_order FOREIGN KEY (order_id) 
        REFERENCES orders(order_id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Historical chronological transitions of order fulfillment';

-- ----------------------------------------------------------------------------
-- DOMAIN E: STOCK RESERVATIONS
-- ----------------------------------------------------------------------------

-- Table 16: stock_reservations
CREATE TABLE IF NOT EXISTS stock_reservations (
    reservation_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    variant_id BIGINT UNSIGNED NOT NULL,
    store_id BIGINT UNSIGNED NOT NULL,
    quantity INT NOT NULL,
    reservation_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_res_order FOREIGN KEY (order_id) 
        REFERENCES orders(order_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_res_variant FOREIGN KEY (variant_id) 
        REFERENCES product_variants(variant_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_res_store FOREIGN KEY (store_id) 
        REFERENCES dark_stores(store_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_res_qty CHECK (quantity > 0),
    CONSTRAINT chk_res_status CHECK (reservation_status IN ('ACTIVE', 'CONFIRMED', 'RELEASED', 'EXPIRED'))
) ENGINE=InnoDB COMMENT='Temporary stock locks during checkout window to prevent overselling';

-- ----------------------------------------------------------------------------
-- DOMAIN F: PAYMENTS & REFUNDS
-- ----------------------------------------------------------------------------

-- Table 17: payments
CREATE TABLE IF NOT EXISTS payments (
    payment_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    transaction_reference VARCHAR(100) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    paid_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_payments_ref UNIQUE (transaction_reference),
    CONSTRAINT fk_payments_order FOREIGN KEY (order_id) 
        REFERENCES orders(order_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_payments_amount CHECK (amount > 0),
    CONSTRAINT chk_payments_method CHECK (payment_method IN ('UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'WALLET', 'COD')),
    CONSTRAINT chk_payments_status CHECK (payment_status IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'))
) ENGINE=InnoDB COMMENT='Simulated and recorded financial transactions for orders';

-- Table 18: refunds
CREATE TABLE IF NOT EXISTS refunds (
    refund_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    payment_id BIGINT UNSIGNED NOT NULL,
    refund_reference VARCHAR(100) NOT NULL,
    refund_amount DECIMAL(10, 2) NOT NULL,
    refund_reason TEXT NULL,
    refund_status VARCHAR(20) NOT NULL DEFAULT 'INITIATED',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME NULL,
    CONSTRAINT uq_refunds_ref UNIQUE (refund_reference),
    CONSTRAINT fk_refunds_payment FOREIGN KEY (payment_id) 
        REFERENCES payments(payment_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_refund_amount CHECK (refund_amount > 0),
    CONSTRAINT chk_refund_status CHECK (refund_status IN ('INITIATED', 'PROCESSED', 'FAILED'))
) ENGINE=InnoDB COMMENT='Refund records corresponding to cancelled or returned orders';

-- ----------------------------------------------------------------------------
-- DOMAIN G: DELIVERY MANAGEMENT
-- ----------------------------------------------------------------------------

-- Table 19: delivery_partners
CREATE TABLE IF NOT EXISTS delivery_partners (
    partner_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    vehicle_type VARCHAR(30) NOT NULL,
    vehicle_number VARCHAR(30) NULL,
    current_latitude DECIMAL(10, 7) NULL,
    current_longitude DECIMAL(10, 7) NULL,
    availability_status VARCHAR(20) NOT NULL DEFAULT 'OFFLINE',
    rating DECIMAL(3, 2) NOT NULL DEFAULT 5.00,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_delivery_partner_user UNIQUE (user_id),
    CONSTRAINT fk_partner_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_partner_vehicle CHECK (vehicle_type IN ('BIKE', 'SCOOTER', 'EV_SCOOTER', 'CYCLE')),
    CONSTRAINT chk_partner_status CHECK (availability_status IN ('AVAILABLE', 'BUSY', 'OFFLINE')),
    CONSTRAINT chk_partner_rating CHECK (rating >= 1.00 AND rating <= 5.00)
) ENGINE=InnoDB COMMENT='Delivery fleet personnel and operational status';

-- Table 20: deliveries
CREATE TABLE IF NOT EXISTS deliveries (
    delivery_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    partner_id BIGINT UNSIGNED NULL,
    delivery_status VARCHAR(30) NOT NULL DEFAULT 'PENDING_ASSIGNMENT',
    assigned_at DATETIME NULL,
    picked_up_at DATETIME NULL,
    delivered_at DATETIME NULL,
    estimated_delivery_time DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_deliveries_order UNIQUE (order_id),
    CONSTRAINT fk_deliveries_order FOREIGN KEY (order_id) 
        REFERENCES orders(order_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_deliveries_partner FOREIGN KEY (partner_id) 
        REFERENCES delivery_partners(partner_id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_delivery_status CHECK (delivery_status IN (
        'PENDING_ASSIGNMENT', 
        'ASSIGNED', 
        'PICKED_UP', 
        'DELIVERED', 
        'FAILED'
    ))
) ENGINE=InnoDB COMMENT='Last-mile delivery assignment and lifecycle dispatch tracking';

-- Table 21: delivery_status_history
CREATE TABLE IF NOT EXISTS delivery_status_history (
    history_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    delivery_id BIGINT UNSIGNED NOT NULL,
    status VARCHAR(30) NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT NULL,
    CONSTRAINT fk_del_history_delivery FOREIGN KEY (delivery_id) 
        REFERENCES deliveries(delivery_id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Audit trail of delivery status transitions';

-- ----------------------------------------------------------------------------
-- DOMAIN H: INTER-STORE STOCK TRANSFERS
-- ----------------------------------------------------------------------------

-- Table 22: stock_transfers
CREATE TABLE IF NOT EXISTS stock_transfers (
    transfer_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    transfer_number VARCHAR(40) NOT NULL,
    source_store_id BIGINT UNSIGNED NOT NULL,
    destination_store_id BIGINT UNSIGNED NOT NULL,
    transfer_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    notes TEXT NULL,
    CONSTRAINT uq_transfers_number UNIQUE (transfer_number),
    CONSTRAINT fk_transfer_source FOREIGN KEY (source_store_id) 
        REFERENCES dark_stores(store_id) 
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_transfer_dest FOREIGN KEY (destination_store_id) 
        REFERENCES dark_stores(store_id) 
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT chk_transfer_diff_stores CHECK (source_store_id <> destination_store_id),
    CONSTRAINT chk_transfer_status CHECK (transfer_status IN ('PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'))
) ENGINE=InnoDB COMMENT='Inter-dark-store inventory rebalancing orders';

-- Table 23: stock_transfer_items
CREATE TABLE IF NOT EXISTS stock_transfer_items (
    transfer_item_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    transfer_id BIGINT UNSIGNED NOT NULL,
    variant_id BIGINT UNSIGNED NOT NULL,
    quantity INT NOT NULL,
    CONSTRAINT uq_transfer_variant UNIQUE (transfer_id, variant_id),
    CONSTRAINT fk_transfer_items_transfer FOREIGN KEY (transfer_id) 
        REFERENCES stock_transfers(transfer_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_transfer_items_variant FOREIGN KEY (variant_id) 
        REFERENCES product_variants(variant_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_transfer_item_qty CHECK (quantity > 0)
) ENGINE=InnoDB COMMENT='Line items transferred between dark stores';

SELECT 'All 23 tables created successfully!' AS Status;
