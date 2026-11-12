# QuickKart — Advanced DBMS Implementation Guide

This document provides technical documentation of the programmable database objects implemented in **Phase 2** for the QuickKart Quick-Commerce Management System.

---

## 1. Programmable Architecture Overview

| Component | Count | File Location | Key Purpose |
| :--- | :--- | :--- | :--- |
| **Views** | 5 | `database/05_views.sql` | Fast analytical reporting without physical data duplication |
| **Functions** | 4 | `database/06_functions.sql` | Mathematical formulas, cart totals, and Haversine geospatial calculations |
| **Stored Procedures** | 6 | `database/07_procedures.sql` | Multi-statement ACID transactions, pessimistic locking, and business workflows |
| **Triggers** | 5 | `database/08_triggers.sql` | Data integrity validation, automatic status logging, and fleet state management |

---

## 2. Views (Analytical & Operational Reporting)

### 1. `vw_available_products`
- **Purpose:** Joins catalogue entities (`products`, `categories`, `brands`, `product_variants`) with store inventory to compute real-time available stock ($Q_{available} = \max(0, Q_{total} - Q_{reserved})$).
- **Use Case:** High-speed product catalog browsing by dark store location.

### 2. `vw_low_stock`
- **Purpose:** Identifies items where $Q_{total} \le reorder\_level$, categorized by urgency (`CRITICAL_ZERO`, `RESERVED_DEPLETED`, `LOW_STOCK`).
- **Use Case:** Dark store inventory reordering and replenishment manifests.

### 3. `vw_daily_store_sales`
- **Purpose:** Aggregates gross merchandise value (GMV), net settled revenue, delivery fee revenue, promo discounts, and average order value (AOV) per dark store per day.
- **Use Case:** Executive and store manager financial analytics dashboard.

### 4. `vw_customer_order_history`
- **Purpose:** Consolidates order details, line-item totals, delivery address snapshots, payment records, and assigned rider information.
- **Use Case:** Customer order tracking and invoice rendering.

### 5. `vw_delivery_performance`
- **Purpose:** Evaluates rider fulfillment metrics: completed vs. failed deliveries, average delivery time in minutes from pickup to doorstep, and customer ratings.
- **Use Case:** Delivery fleet management and SLA monitoring.

---

## 3. Stored Functions

### 1. `fn_get_available_stock(p_store_id, p_variant_id)`
- **Returns:** `INT`
- **Logic:** Queries `store_inventory` for the given store and SKU; returns `GREATEST(0, total_quantity - reserved_quantity)`. Returns 0 if unstocked.

### 2. `fn_calculate_cart_total(p_cart_id)`
- **Returns:** `DECIMAL(10, 2)`
- **Logic:** Performs an inner join between `cart_items` and `product_variants` to aggregate the total item value in an active shopping cart.

### 3. `fn_haversine_distance(lat1, lon1, lat2, lon2)`
- **Returns:** `DECIMAL(10, 3)` (distance in kilometers)
- **Logic:** Implements the great-circle Haversine formula over Earth's sphere radius ($R = 6371.0\text{ km}$):
$$d = 2R \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1 - a}\right)$$
$$\text{where } a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)$$

### 4. `fn_is_store_servicing_address(p_store_id, p_address_id)`
- **Returns:** `BOOLEAN` (1 or 0)
- **Logic:** Retrieves store coordinates and customer address coordinates; calculates distance via `fn_haversine_distance`; returns whether $\text{distance} \le \text{service\_radius\_km}$.

---

## 4. Stored Procedures (ACID Transactions)

### 1. `sp_place_order`
- **Concurrency & Locking:** Uses `SELECT ... FOR UPDATE` row locks on `store_inventory` records for all cart items to prevent race conditions during concurrent checkouts.
- **Transaction Guarantee:** Ensures that order creation, address snapshotting, inventory reservation increment, payment record creation, and delivery dispatch task generation are strictly atomic.
- **Rollback Behavior:** If any item lacks sufficient stock ($Q_{available} < Q_{cart}$), rolls back the entire transaction and returns HTTP status code 409 with an explanatory message.

### 2. `sp_cancel_order`
- **Workflow:** Cancels active orders in 'PENDING', 'CONFIRMED', or 'PACKING' state.
- **Stock Reversal:** Releases locked reservations and decrements `reserved_quantity` in `store_inventory`.
- **Financial Reversal:** If payment was completed, transitions payment status to 'REFUNDED' and creates an audit refund entry in `refunds`.

### 3. `sp_add_inventory`
- **Workflow:** Inward restock procedure for store managers that updates `total_quantity` and generates an audit record in `inventory_transactions`.

### 4. `sp_transfer_inventory`
- **Workflow:** Moves stock between two dark stores; validates source availability; decrements source inventory (`TRANSFER_OUT`); increments destination inventory (`TRANSFER_IN`); records a transfer manifest in `stock_transfers`.

### 5. `sp_assign_delivery`
- **Workflow:** Dispatches an available rider to an order; sets partner status to 'BUSY'; transitions order status to 'OUT_FOR_DELIVERY'; writes to `delivery_status_history`.

### 6. `sp_release_expired_reservations`
- **Workflow:** Background sweep procedure that detects reservations where `expires_at < NOW()` and releases reserved inventory back to available stock.

---

## 5. Triggers (Business Rule Enforcement)

1. **`trg_validate_order_item` (BEFORE INSERT on `order_items`):**  
   Validates positive quantity and non-negative unit price; automatically calculates `NEW.subtotal = NEW.quantity * NEW.unit_price`.
2. **`trg_order_status_history` (AFTER UPDATE on `orders`):**  
   Automatically inserts an audit record into `order_status_history` whenever `order_status` changes.
3. **`trg_delivery_status_history` (AFTER UPDATE on `deliveries`):**  
   Automatically tracks state changes in the delivery lifecycle.
4. **`trg_release_rider_on_delivered` (AFTER UPDATE on `deliveries`):**  
   Automatically marks the delivery partner as 'AVAILABLE' once an order is marked 'DELIVERED' or 'FAILED'.
5. **`trg_validate_cart_item_insert` & `trg_validate_cart_item_update` (BEFORE INSERT/UPDATE on `cart_items`):**  
   Prevents non-positive item quantities in shopping carts.
