# QuickKart — Entity-Relationship (ER) Model

This document outlines the complete Entity-Relationship diagram for the **QuickKart Quick-Commerce Management System**.

## Mermaid ER Diagram

```mermaid
erDiagram
    ROLES ||--o{ USERS : "assigned to"
    USERS ||--o{ ADDRESSES : "owns"
    USERS ||--o{ CARTS : "creates"
    USERS ||--o{ ORDERS : "places"
    USERS ||--o| DELIVERY_PARTNERS : "registered as"

    CATEGORIES ||--o{ CATEGORIES : "parent of"
    CATEGORIES ||--o{ PRODUCTS : "categorizes"
    BRANDS ||--o{ PRODUCTS : "manufactures"
    PRODUCTS ||--o{ PRODUCT_VARIANTS : "has variants"

    DARK_STORES ||--o{ STORE_INVENTORY : "stocks"
    PRODUCT_VARIANTS ||--o{ STORE_INVENTORY : "stocked in"
    STORE_INVENTORY ||--o{ INVENTORY_TRANSACTIONS : "audits"

    DARK_STORES ||--o{ CARTS : "tethered to"
    CARTS ||--o{ CART_ITEMS : "contains"
    PRODUCT_VARIANTS ||--o{ CART_ITEMS : "selected in"

    DARK_STORES ||--o{ ORDERS : "fulfills"
    ADDRESSES ||--o{ ORDERS : "delivered to"
    ORDERS ||--o{ ORDER_ITEMS : "contains"
    PRODUCT_VARIANTS ||--o{ ORDER_ITEMS : "historical snapshot of"
    ORDERS ||--o{ ORDER_STATUS_HISTORY : "tracks status of"

    ORDERS ||--o{ STOCK_RESERVATIONS : "reserves for"
    PRODUCT_VARIANTS ||--o{ STOCK_RESERVATIONS : "reserved variant"
    DARK_STORES ||--o{ STOCK_RESERVATIONS : "locked at"

    ORDERS ||--o{ PAYMENTS : "paid through"
    PAYMENTS ||--o{ REFUNDS : "refunded via"

    DELIVERY_PARTNERS ||--o{ DELIVERIES : "assigned to"
    ORDERS ||--|| DELIVERIES : "dispatched as"
    DELIVERIES ||--o{ DELIVERY_STATUS_HISTORY : "logs progress"

    DARK_STORES ||--o{ STOCK_TRANSFERS : "source hub"
    DARK_STORES ||--o{ STOCK_TRANSFERS : "dest hub"
    STOCK_TRANSFERS ||--o{ STOCK_TRANSFER_ITEMS : "includes"
    PRODUCT_VARIANTS ||--o{ STOCK_TRANSFER_ITEMS : "rebalanced SKU"
```

## Domain Partitioning

| Domain | Entity Count | Core Tables |
| :--- | :--- | :--- |
| **A. Identity & Access** | 3 | `roles`, `users`, `addresses` |
| **B. Product Catalogue** | 4 | `categories`, `brands`, `products`, `product_variants` |
| **C. Dark Stores & Inventory** | 3 | `dark_stores`, `store_inventory`, `inventory_transactions` |
| **D. Carts & Orders** | 5 | `carts`, `cart_items`, `orders`, `order_items`, `order_status_history` |
| **E. Stock Reservations** | 1 | `stock_reservations` |
| **F. Payments & Refunds** | 2 | `payments`, `refunds` |
| **G. Delivery Management** | 3 | `delivery_partners`, `deliveries`, `delivery_status_history` |
| **H. Stock Transfers** | 2 | `stock_transfers`, `stock_transfer_items` |
| **Total** | **23 Tables** | Complete 3NF Normalized System |
