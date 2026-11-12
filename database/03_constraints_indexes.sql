-- ============================================================================
-- QuickKart: Quick-Commerce Management System
-- Script: 03_constraints_indexes.sql
-- Description: Creates performance indexes for fast lookups, joins, filtering,
--              and analytical aggregation queries.
-- ============================================================================

USE quickkart_db;

-- ----------------------------------------------------------------------------
-- 1. Identity & Customer Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_status ON users(account_status);
CREATE INDEX idx_addresses_user_default ON addresses(user_id, is_default);
CREATE INDEX idx_addresses_pincode ON addresses(pincode);

-- ----------------------------------------------------------------------------
-- 2. Product Catalogue Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_categories_parent ON categories(parent_category_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_name ON products(product_name);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_price ON product_variants(price);
CREATE INDEX idx_variants_active ON product_variants(is_active);

-- ----------------------------------------------------------------------------
-- 3. Dark Store & Inventory Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_stores_area ON dark_stores(area);
CREATE INDEX idx_stores_active ON dark_stores(is_active);

-- High-performance index for checking available stock at a specific store
CREATE INDEX idx_inventory_lookup ON store_inventory(store_id, variant_id, total_quantity, reserved_quantity);

-- Composite index to accelerate finding low-stock inventory needing reorders
CREATE INDEX idx_inventory_reorder_scan ON store_inventory(store_id, total_quantity, reorder_level);

-- Audit log indexes for transaction tracing
CREATE INDEX idx_inv_tx_inventory_created ON inventory_transactions(inventory_id, created_at);
CREATE INDEX idx_inv_tx_reference ON inventory_transactions(reference_id, transaction_type);

-- ----------------------------------------------------------------------------
-- 4. Cart Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_carts_user_status ON carts(user_id, cart_status);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_variant ON cart_items(variant_id);

-- ----------------------------------------------------------------------------
-- 5. Order & Order History Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX idx_orders_store_status ON orders(store_id, order_status);
CREATE INDEX idx_orders_status_created ON orders(order_status, created_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_variant ON order_items(variant_id);
CREATE INDEX idx_order_history_order ON order_status_history(order_id, changed_at ASC);

-- ----------------------------------------------------------------------------
-- 6. Stock Reservation Indexes
-- ----------------------------------------------------------------------------
-- Crucial for background event / cron procedure: sp_release_expired_reservations
CREATE INDEX idx_res_status_expires ON stock_reservations(reservation_status, expires_at);
CREATE INDEX idx_res_store_variant ON stock_reservations(store_id, variant_id);
CREATE INDEX idx_res_order ON stock_reservations(order_id);

-- ----------------------------------------------------------------------------
-- 7. Payment & Refund Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_payments_created ON payments(created_at DESC);
CREATE INDEX idx_refunds_payment ON refunds(payment_id);
CREATE INDEX idx_refunds_status ON refunds(refund_status);

-- ----------------------------------------------------------------------------
-- 8. Delivery Fleet Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_partner_status ON delivery_partners(availability_status);
CREATE INDEX idx_partner_rating ON delivery_partners(rating DESC);
CREATE INDEX idx_deliveries_partner_status ON deliveries(partner_id, delivery_status);
CREATE INDEX idx_deliveries_status ON deliveries(delivery_status);
CREATE INDEX idx_del_history_delivery ON delivery_status_history(delivery_id, updated_at ASC);

-- ----------------------------------------------------------------------------
-- 9. Stock Transfer Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_transfers_source ON stock_transfers(source_store_id, transfer_status);
CREATE INDEX idx_transfers_dest ON stock_transfers(destination_store_id, transfer_status);
CREATE INDEX idx_transfers_status ON stock_transfers(transfer_status, created_at DESC);
CREATE INDEX idx_transfer_items_transfer ON stock_transfer_items(transfer_id);

SELECT 'All secondary indexes created successfully!' AS Status;
