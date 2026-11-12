# QuickKart — Relational Schema & Data Dictionary

Database: `quickkart_db`  
Storage Engine: `InnoDB`  
Character Set: `utf8mb4`  
Collation: `utf8mb4_unicode_ci`  

---

## Domain A: Identity & Access Management

### 1. `roles`
Stores system privilege roles for Role-Based Access Control (RBAC).

| Column | Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `role_id` | BIGINT UNSIGNED | NO | PK, AUTO_INCREMENT | Unique role identifier |
| `role_name` | VARCHAR(30) | NO | UNIQUE, CHECK IN ('CUSTOMER', 'ADMIN', 'STORE_MANAGER', 'DELIVERY_PARTNER') | Role name |
| `description` | VARCHAR(255) | YES | - | Role permissions summary |
| `created_at` | DATETIME | NO | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

### 2. `users`
Master user accounts covering customers, store managers, delivery fleet, and admins.

| Column | Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `user_id` | BIGINT UNSIGNED | NO | PK, AUTO_INCREMENT | Unique user identifier |
| `role_id` | BIGINT UNSIGNED | NO | FK -> `roles(role_id)` | Role assignment |
| `full_name` | VARCHAR(100) | NO | - | User full legal name |
| `email` | VARCHAR(150) | NO | UNIQUE | Primary email contact |
| `phone` | VARCHAR(15) | NO | UNIQUE | Phone number with country code |
| `password_hash` | VARCHAR(255) | NO | - | Bcrypt hashed credentials |
| `account_status`| VARCHAR(20) | NO | CHECK IN ('ACTIVE', 'INACTIVE', 'SUSPENDED') | Account state |
| `created_at` | DATETIME | NO | DEFAULT CURRENT_TIMESTAMP | Account creation time |
| `updated_at` | DATETIME | NO | ON UPDATE CURRENT_TIMESTAMP | Last modification |

### 3. `addresses`
Saved delivery locations for customers.

| Column | Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `address_id` | BIGINT UNSIGNED | NO | PK, AUTO_INCREMENT | Unique address identifier |
| `user_id` | BIGINT UNSIGNED | NO | FK -> `users(user_id)` ON DELETE CASCADE | Owner customer |
| `address_line`| VARCHAR(255) | NO | - | Door/Flat no, building, street |
| `area` | VARCHAR(100) | NO | - | Locality / neighborhood |
| `city` | VARCHAR(100) | NO | DEFAULT 'Chennai' | City |
| `state` | VARCHAR(50) | NO | DEFAULT 'Tamil Nadu' | State |
| `pincode` | VARCHAR(10) | NO | - | Postal PIN code |
| `latitude` | DECIMAL(10, 7)| YES | - | GPS latitude |
| `longitude`| DECIMAL(10, 7)| YES | - | GPS longitude |
| `address_type`| VARCHAR(20) | NO | CHECK IN ('HOME', 'WORK', 'OTHER') | Label |
| `is_default` | BOOLEAN | NO | DEFAULT FALSE | Default delivery address |
| `created_at` | DATETIME | NO | DEFAULT CURRENT_TIMESTAMP | Record created timestamp |

---

## Domain B: Product Catalogue

### 4. `categories`
Hierarchical category tree with self-referential parent key.

| Column | Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `category_id` | BIGINT UNSIGNED | NO | PK, AUTO_INCREMENT | Unique category identifier |
| `parent_category_id` | BIGINT UNSIGNED | YES | FK -> `categories(category_id)` | Parent category (NULL for root) |
| `category_name` | VARCHAR(100) | NO | - | Category display title |
| `slug` | VARCHAR(120) | NO | UNIQUE | URL-friendly slug |
| `description` | TEXT | YES | - | Category details |
| `image_url` | VARCHAR(500) | YES | - | Banner image URL |
| `is_active` | BOOLEAN | NO | DEFAULT TRUE | Active status |
| `created_at` | DATETIME | NO | DEFAULT CURRENT_TIMESTAMP | Creation time |

### 5. `brands`
Product manufacturer brands.

| Column | Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `brand_id` | BIGINT UNSIGNED | NO | PK, AUTO_INCREMENT | Unique brand identifier |
| `brand_name` | VARCHAR(100) | NO | UNIQUE | Brand name (e.g. Amul, Aavin) |
| `description`| TEXT | YES | - | Brand overview |
| `logo_url` | VARCHAR(500) | YES | - | Logo image link |
| `created_at` | DATETIME | NO | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

### 6. `products`
Master catalogue entities.

| Column | Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `product_id` | BIGINT UNSIGNED | NO | PK, AUTO_INCREMENT | Unique product identifier |
| `category_id` | BIGINT UNSIGNED | NO | FK -> `categories(category_id)` | Assigned subcategory |
| `brand_id` | BIGINT UNSIGNED | NO | FK -> `brands(brand_id)` | Assigned brand |
| `product_name` | VARCHAR(150) | NO | - | Product title |
| `description` | TEXT | YES | - | Detailed product information |
| `image_url` | VARCHAR(500) | YES | - | Primary product thumbnail |
| `is_active` | BOOLEAN | NO | DEFAULT TRUE | Visibility flag |
| `created_at` | DATETIME | NO | DEFAULT CURRENT_TIMESTAMP | Registration timestamp |
| `updated_at` | DATETIME | NO | ON UPDATE CURRENT_TIMESTAMP | Last modification |

### 7. `product_variants`
Specific Stock Keeping Units (SKUs) with weight/volume units and pricing.

| Column | Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `variant_id` | BIGINT UNSIGNED | NO | PK, AUTO_INCREMENT | Unique variant identifier |
| `product_id` | BIGINT UNSIGNED | NO | FK -> `products(product_id)` ON DELETE CASCADE | Parent product |
| `sku` | VARCHAR(50) | NO | UNIQUE | Machine SKU code |
| `variant_name`| VARCHAR(100) | NO | - | Variant title (e.g. 500 ml Pouch) |
| `unit` | VARCHAR(30) | NO | - | Unit measure (500 ml, 1 kg) |
| `price` | DECIMAL(10, 2) | NO | CHECK (price >= 0) | Selling price (INR) |
| `mrp` | DECIMAL(10, 2) | YES | CHECK (mrp >= price) | Maximum Retail Price |
| `is_active` | BOOLEAN | NO | DEFAULT TRUE | Active flag |
| `created_at` | DATETIME | NO | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

---

## Domain C: Dark Stores & Inventory Management

### 8. `dark_stores`
Micro-fulfillment warehouses across Chennai.

| Column | Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `store_id` | BIGINT UNSIGNED | NO | PK, AUTO_INCREMENT | Unique store identifier |
| `store_name` | VARCHAR(100) | NO | - | Hub title (e.g. T. Nagar Hub) |
| `address` | VARCHAR(255) | NO | - | Physical street address |
| `area` | VARCHAR(100) | NO | - | Neighborhood / locality |
| `city` | VARCHAR(100) | NO | DEFAULT 'Chennai' | City |
| `pincode` | VARCHAR(10) | NO | - | Hub PIN code |
| `latitude` | DECIMAL(10, 7) | NO | - | Exact GPS latitude |
| `longitude`| DECIMAL(10, 7) | NO | - | Exact GPS longitude |
| `service_radius_km` | DECIMAL(5, 2) | NO | DEFAULT 5.00, CHECK (> 0) | Delivery service radius |
| `is_active` | BOOLEAN | NO | DEFAULT TRUE | Operational status |
| `created_at` | DATETIME | NO | DEFAULT CURRENT_TIMESTAMP | Opening timestamp |

### 9. `store_inventory`
Live inventory levels per store with strict available/reserved separation.

| Column | Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `inventory_id` | BIGINT UNSIGNED | NO | PK, AUTO_INCREMENT | Unique inventory row ID |
| `store_id` | BIGINT UNSIGNED | NO | FK -> `dark_stores(store_id)` | Dark store location |
| `variant_id` | BIGINT UNSIGNED | NO | FK -> `product_variants(variant_id)` | Product SKU |
| `total_quantity` | INT | NO | DEFAULT 0, CHECK (>= 0) | Physical stock on shelves |
| `reserved_quantity` | INT | NO | DEFAULT 0, CHECK (>= 0) | Temporarily locked in checkout |
| `reorder_level` | INT | NO | DEFAULT 10, CHECK (>= 0) | Threshold for restocking alert |
| `updated_at` | DATETIME | NO | ON UPDATE CURRENT_TIMESTAMP | Last stock count change |
| - | - | - | UNIQUE (`store_id`, `variant_id`) | 1 record per variant per store |
| - | - | - | CHECK (`reserved_quantity <= total_quantity`) | Integrity rule |

### 10. `inventory_transactions`
Audit trail of every balance increase, reservation, reduction, or transfer.

| Column | Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `transaction_id` | BIGINT UNSIGNED | NO | PK, AUTO_INCREMENT | Audit record ID |
| `inventory_id` | BIGINT UNSIGNED | NO | FK -> `store_inventory(inventory_id)` | Target inventory record |
| `transaction_type`| VARCHAR(30) | NO | CHECK IN ('RESTOCK', 'ORDER_RESERVED', 'ORDER_FULFILLED', 'ORDER_CANCELLED', 'TRANSFER_IN', 'TRANSFER_OUT', 'DAMAGE_ADJUSTMENT', 'AUDIT_CORRECTION') | Action type |
| `quantity_change` | INT | NO | - | Delta (+ or -) |
| `previous_quantity`| INT | NO | - | Stock before change |
| `new_quantity` | INT | NO | - | Stock after change |
| `reference_id` | BIGINT UNSIGNED | YES | - | Linked order_id or transfer_id |
| `notes` | TEXT | YES | - | Audit reason / memo |
| `created_at` | DATETIME | NO | DEFAULT CURRENT_TIMESTAMP | Log timestamp |

---

## Domain D: Shopping Carts & Order Management

### 11. `carts`
Active session carts tied to a chosen dark store.

| Column | Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `cart_id` | BIGINT UNSIGNED | NO | PK, AUTO_INCREMENT | Cart session ID |
| `user_id` | BIGINT UNSIGNED | NO | FK -> `users(user_id)` ON DELETE CASCADE | Customer user |
| `store_id` | BIGINT UNSIGNED | NO | FK -> `dark_stores(store_id)` | Fulfilling dark store |
| `cart_status`| VARCHAR(20) | NO | CHECK IN ('ACTIVE', 'ABANDONED', 'CONVERTED') | Cart lifecycle state |
| `created_at` | DATETIME | NO | DEFAULT CURRENT_TIMESTAMP | Cart creation time |
| `updated_at` | DATETIME | NO | ON UPDATE CURRENT_TIMESTAMP | Last item update |

### 12. `cart_items`
Line items in active customer carts.

| Column | Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `cart_item_id` | BIGINT UNSIGNED | NO | PK, AUTO_INCREMENT | Item row identifier |
| `cart_id` | BIGINT UNSIGNED | NO | FK -> `carts(cart_id)` ON DELETE CASCADE | Parent cart |
| `variant_id` | BIGINT UNSIGNED | NO | FK -> `product_variants(variant_id)` | Selected SKU |
| `quantity` | INT | NO | DEFAULT 1, CHECK (quantity > 0) | Selected units |
| `created_at` | DATETIME | NO | DEFAULT CURRENT_TIMESTAMP | Added timestamp |
| `updated_at` | DATETIME | NO | ON UPDATE CURRENT_TIMESTAMP | Quantity changed time |
| - | - | - | UNIQUE (`cart_id`, `variant_id`) | Single item line per SKU |

### 13. `orders`
Master order transactions.

| Column | Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `order_id` | BIGINT UNSIGNED | NO | PK, AUTO_INCREMENT | Unique order ID |
| `user_id` | BIGINT UNSIGNED | NO | FK -> `users(user_id)` | Customer placing order |
| `store_id` | BIGINT UNSIGNED | NO | FK -> `dark_stores(store_id)` | Fulfilling dark store |
| `address_id` | BIGINT UNSIGNED | NO | FK -> `addresses(address_id)` | Destination address reference |
| `order_number` | VARCHAR(40) | NO | UNIQUE | Human-readable order code |
| `delivery_address_snapshot` | TEXT | NO | - | Immutable address string at order time |
| `subtotal` | DECIMAL(10, 2) | NO | CHECK (subtotal >= 0) | Items total |
| `delivery_fee`| DECIMAL(10, 2) | NO | DEFAULT 0.00, CHECK (>= 0) | Express delivery charge |
| `discount` | DECIMAL(10, 2) | NO | DEFAULT 0.00, CHECK (>= 0) | Coupon / promo discount |
| `total_amount`| DECIMAL(10, 2) | NO | CHECK (total_amount >= 0) | Net payable amount |
| `order_status`| VARCHAR(30) | NO | CHECK IN ('PENDING', 'CONFIRMED', 'PACKING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED') | Fulfillment state |
| `created_at` | DATETIME | NO | DEFAULT CURRENT_TIMESTAMP | Checkout timestamp |
| `updated_at` | DATETIME | NO | ON UPDATE CURRENT_TIMESTAMP | Last status update |

### 14. `order_items`
Purchased items with snapshot naming and pricing.

| Column | Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `order_item_id` | BIGINT UNSIGNED | NO | PK, AUTO_INCREMENT | Order line item ID |
| `order_id` | BIGINT UNSIGNED | NO | FK -> `orders(order_id)` ON DELETE CASCADE | Parent order |
| `variant_id` | BIGINT UNSIGNED | NO | FK -> `product_variants(variant_id)` | Target variant SKU |
| `product_name_snapshot` | VARCHAR(150) | NO | - | Product title at purchase |
| `variant_name_snapshot` | VARCHAR(100) | NO | - | Variant title at purchase |
| `quantity` | INT | NO | CHECK (quantity > 0) | Units purchased |
| `unit_price` | DECIMAL(10, 2) | NO | CHECK (unit_price >= 0) | Historical unit price |
| `subtotal` | DECIMAL(10, 2) | NO | CHECK (subtotal >= 0) | Line total (qty * price) |

### 15. `order_status_history`
Chronological audit of order transitions.

| Column | Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `history_id` | BIGINT UNSIGNED | NO | PK, AUTO_INCREMENT | History transition ID |
| `order_id` | BIGINT UNSIGNED | NO | FK -> `orders(order_id)` ON DELETE CASCADE | Linked order |
| `previous_status` | VARCHAR(30) | YES | - | Prior order status |
| `new_status` | VARCHAR(30) | NO | - | New status entered |
| `changed_at` | DATETIME | NO | DEFAULT CURRENT_TIMESTAMP | Transition time |
| `remarks` | TEXT | YES | - | Notes / reason |

---

## Domain E: Stock Reservations

### 16. `stock_reservations`
Temporary stock locks during checkout window.

| Column | Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `reservation_id` | BIGINT UNSIGNED | NO | PK, AUTO_INCREMENT | Reservation identifier |
| `order_id` | BIGINT UNSIGNED | NO | FK -> `orders(order_id)` ON DELETE CASCADE | Associated order |
| `variant_id` | BIGINT UNSIGNED | NO | FK -> `product_variants(variant_id)` | Locked SKU |
| `store_id` | BIGINT UNSIGNED | NO | FK -> `dark_stores(store_id)` | Dark store location |
| `quantity` | INT | NO | CHECK (quantity > 0) | Quantity held |
| `reservation_status` | VARCHAR(20) | NO | CHECK IN ('ACTIVE', 'CONFIRMED', 'RELEASED', 'EXPIRED') | Status |
| `expires_at` | DATETIME | NO | - | Expiration timestamp (e.g. 15 mins) |
| `created_at` | DATETIME | NO | DEFAULT CURRENT_TIMESTAMP | Time reservation made |

---

## Domain F: Payments & Refunds

### 17. `payments`
Recorded financial transactions.

| Column | Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `payment_id` | BIGINT UNSIGNED | NO | PK, AUTO_INCREMENT | Payment record ID |
| `order_id` | BIGINT UNSIGNED | NO | FK -> `orders(order_id)` | Linked order |
| `transaction_reference` | VARCHAR(100) | NO | UNIQUE | Payment gateway txn ID |
| `payment_method` | VARCHAR(30) | NO | CHECK IN ('UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'WALLET', 'COD') | Payment channel |
| `amount` | DECIMAL(10, 2) | NO | CHECK (amount > 0) | Amount charged |
| `payment_status` | VARCHAR(20) | NO | CHECK IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') | Status |
| `paid_at` | DATETIME | YES | - | Payment timestamp |
| `created_at` | DATETIME | NO | DEFAULT CURRENT_TIMESTAMP | Creation time |

### 18. `refunds`
Reversal transactions for cancelled orders.

| Column | Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `refund_id` | BIGINT UNSIGNED | NO | PK, AUTO_INCREMENT | Refund record ID |
| `payment_id` | BIGINT UNSIGNED | NO | FK -> `payments(payment_id)` | Source payment |
| `refund_reference` | VARCHAR(100) | NO | UNIQUE | Gateway refund reference |
| `refund_amount` | DECIMAL(10, 2) | NO | CHECK (refund_amount > 0) | Refund amount |
| `refund_reason` | TEXT | YES | - | Reason for refund |
| `refund_status` | VARCHAR(20) | NO | CHECK IN ('INITIATED', 'PROCESSED', 'FAILED') | Status |
| `created_at` | DATETIME | NO | DEFAULT CURRENT_TIMESTAMP | Initiation time |
| `processed_at` | DATETIME | YES | - | Completion time |

---

## Domain G: Delivery Fleet Management

### 19. `delivery_partners`
Riders registered in the delivery fleet.

| Column | Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `partner_id` | BIGINT UNSIGNED | NO | PK, AUTO_INCREMENT | Partner record ID |
| `user_id` | BIGINT UNSIGNED | NO | UNIQUE, FK -> `users(user_id)` ON DELETE CASCADE | Linked user account |
| `vehicle_type` | VARCHAR(30) | NO | CHECK IN ('BIKE', 'SCOOTER', 'EV_SCOOTER', 'CYCLE') | Vehicle type |
| `vehicle_number` | VARCHAR(30) | YES | - | Registration plate |
| `current_latitude` | DECIMAL(10, 7) | YES | - | Current GPS latitude |
| `current_longitude`| DECIMAL(10, 7) | YES | - | Current GPS longitude |
| `availability_status`| VARCHAR(20) | NO | CHECK IN ('AVAILABLE', 'BUSY', 'OFFLINE') | Fleet state |
| `rating` | DECIMAL(3, 2) | NO | DEFAULT 5.00, CHECK (rating BETWEEN 1 AND 5) | Customer rating |
| `created_at` | DATETIME | NO | DEFAULT CURRENT_TIMESTAMP | Enrolled timestamp |

### 20. `deliveries`
Last-mile delivery assignments.

| Column | Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `delivery_id` | BIGINT UNSIGNED | NO | PK, AUTO_INCREMENT | Delivery task ID |
| `order_id` | BIGINT UNSIGNED | NO | UNIQUE, FK -> `orders(order_id)` | Linked order |
| `partner_id` | BIGINT UNSIGNED | YES | FK -> `delivery_partners(partner_id)` | Assigned rider |
| `delivery_status` | VARCHAR(30) | NO | CHECK IN ('PENDING_ASSIGNMENT', 'ASSIGNED', 'PICKED_UP', 'DELIVERED', 'FAILED') | Status |
| `assigned_at` | DATETIME | YES | - | Rider assigned timestamp |
| `picked_up_at` | DATETIME | YES | - | Package collected timestamp |
| `delivered_at` | DATETIME | YES | - | Doorstep delivery timestamp |
| `estimated_delivery_time` | DATETIME | YES | - | SLA promised time |
| `created_at` | DATETIME | NO | DEFAULT CURRENT_TIMESTAMP | Created time |
| `updated_at` | DATETIME | NO | ON UPDATE CURRENT_TIMESTAMP | Last modification |

### 21. `delivery_status_history`
Chronological dispatch log for tracking delivery SLA.

| Column | Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `history_id` | BIGINT UNSIGNED | NO | PK, AUTO_INCREMENT | History log ID |
| `delivery_id` | BIGINT UNSIGNED | NO | FK -> `deliveries(delivery_id)` ON DELETE CASCADE | Parent delivery |
| `status` | VARCHAR(30) | NO | - | Status entered |
| `updated_at` | DATETIME | NO | DEFAULT CURRENT_TIMESTAMP | Transition time |
| `remarks` | TEXT | YES | - | Rider/hub notes |

---

## Domain H: Inter-Store Stock Transfers

### 22. `stock_transfers`
Inter-hub inventory rebalancing manifests.

| Column | Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `transfer_id` | BIGINT UNSIGNED | NO | PK, AUTO_INCREMENT | Transfer manifest ID |
| `transfer_number` | VARCHAR(40) | NO | UNIQUE | Human code (e.g. TRF-2026-0001) |
| `source_store_id` | BIGINT UNSIGNED | NO | FK -> `dark_stores(store_id)` | Dispatching dark store |
| `destination_store_id` | BIGINT UNSIGNED | NO | FK -> `dark_stores(store_id)` | Receiving dark store |
| `transfer_status` | VARCHAR(20) | NO | CHECK IN ('PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED') | Status |
| `created_at` | DATETIME | NO | DEFAULT CURRENT_TIMESTAMP | Created time |
| `completed_at` | DATETIME | YES | - | Received time |
| `notes` | TEXT | YES | - | Justification memo |
| - | - | - | CHECK (`source_store_id <> destination_store_id`) | Must be distinct hubs |

### 23. `stock_transfer_items`
SKUs and quantities in transfer shipments.

| Column | Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `transfer_item_id` | BIGINT UNSIGNED | NO | PK, AUTO_INCREMENT | Transfer line item ID |
| `transfer_id` | BIGINT UNSIGNED | NO | FK -> `stock_transfers(transfer_id)` ON DELETE CASCADE | Parent manifest |
| `variant_id` | BIGINT UNSIGNED | NO | FK -> `product_variants(variant_id)` | Transferred SKU |
| `quantity` | INT | NO | CHECK (quantity > 0) | Quantity in transit |
| - | - | - | UNIQUE (`transfer_id`, `variant_id`) | Unique item per manifest |
