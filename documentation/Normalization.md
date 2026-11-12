# QuickKart — Database Normalization & Design Analysis

This document provides a formal normalization analysis of the **QuickKart Quick-Commerce Management System** relational schema, demonstrating adherence to **Third Normal Form (3NF)**.

---

## 1. Normalization Objectives

In a high-throughput quick-commerce system (similar to Zepto and Blinkit), database normalization achieves three essential goals:
1. **Elimination of Update, Insertion, and Deletion Anomalies.**
2. **Data Consistency across Multi-Store Inventories.**
3. **Preservation of Transactional History (Historical Integrity).**

---

## 2. First Normal Form (1NF)

**Definition:** A relation is in 1NF if:
1. Every attribute contains only atomic (indivisible) values.
2. There are no repeating groups or multivalued attributes.
3. Each record is uniquely identified by a primary key.

### Application in QuickKart:
- **No Multivalued Attributes:** Address components (`address_line`, `area`, `city`, `pincode`, `latitude`, `longitude`) are stored as distinct scalar columns, rather than combined strings.
- **No Repeating Groups:** Instead of storing multiple items in columns like `item_1`, `item_2`, `item_3` in `orders`, items are modeled as separate rows in `order_items`.
- **Primary Keys:** Every single table contains an explicit `BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY`.

---

## 3. Second Normal Form (2NF)

**Definition:** A relation is in 2NF if:
1. It is in 1NF.
2. Every non-prime attribute is fully functionally dependent on the entire primary key (no partial dependencies on a composite candidate key).

### Application in QuickKart:
All tables use synthetic surrogate primary keys (`table_id`). Where business composite candidate keys exist:
- **`store_inventory (store_id, variant_id)`**: Attributes such as `total_quantity`, `reserved_quantity`, and `reorder_level` depend on both `store_id` AND `variant_id`. You cannot determine stock without knowing both the specific dark store and the specific SKU. Hence, no partial dependency exists.
- **`cart_items (cart_id, variant_id)`**: `quantity` depends on the combination of `cart_id` and `variant_id`.
- **`stock_transfer_items (transfer_id, variant_id)`**: `quantity` depends on both the transfer manifest and the variant being moved.

---

## 4. Third Normal Form (3NF)

**Definition:** A relation is in 3NF if:
1. It is in 2NF.
2. There are no transitive dependencies between non-key attributes (i.e., for every non-trivial functional dependency $X \rightarrow Y$, either $X$ is a superkey, or $Y$ is a prime attribute).

### Application in QuickKart:
- **Catalogue Decomposition:**
  - Product details are separated from Brands: `products(category_id, brand_id, product_name)`. We do not store `brand_name` or `brand_description` in `products`, avoiding `product_id -> brand_id -> brand_name`.
  - Product details are separated from Variants: `product_variants(product_id, sku, unit, price)`. A product like "Amul Milk" has multiple packaging options (500 ml, 1 Litre).
- **Store-Inventory Separation:**
  - Products and variants do NOT maintain stock counts. Stock counts are strictly isolated in `store_inventory(store_id, variant_id, total_quantity)`. This prevents redundant product descriptions when the same item is stocked in multiple dark stores across Chennai (T. Nagar, Adyar, etc.).
- **User vs Delivery Fleet:**
  - Riders are authenticated via `users`, while vehicular and operational parameters are managed in `delivery_partners`.
- **Orders vs Payments:**
  - Payment attempts and refunds have independent lifecycle entities (`payments`, `refunds`), preventing order record locks during asynchronous payment webhook callbacks.

---

## 5. Architectural Exception: Intentional Snapshot Denormalization

Academic DBMS criteria distinguish between accidental transitive dependency and **intentional historical snapshotting**:

1. **`order_items (product_name_snapshot, unit_price, subtotal)`**:
   - When a catalogue item's price or description changes next month, past customer invoices must NOT dynamically update to the new price.
   - Retaining the snapshot at `created_at` represents the historical truth of the commercial contract at transaction time.
2. **`orders (delivery_address_snapshot)`**:
   - If a customer edits their saved address in their profile next week, an order delivered today must still preserve the exact street address to which the rider was dispatched.

Both design patterns are standard enterprise patterns compliant with audit and compliance standards while preserving 3NF across operational entities.
