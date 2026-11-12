# QuickKart — Quick-Commerce Management System

> **Advanced DBMS Individual Project**  
> Inspired by high-speed grocery delivery platforms (Blinkit, Zepto) built with a normalized **MySQL 8.0** relational database, **Node.js / Express**, and **React**.

---

## 🏗 Project Architecture

```
┌────────────────────────────────────────────┐
│             PRESENTATION LAYER             │
│             React + Vanilla CSS            │
│  Customer Dashboard | Admin | Delivery     │
└──────────────────────┬─────────────────────┘
                       │ REST API
                       ▼
┌────────────────────────────────────────────┐
│              APPLICATION LAYER             │
│              Node.js + Express             │
│ Auth | Catalogue | Cart | Orders | Fleet   │
└──────────────────────┬─────────────────────┘
                       │ SQL / Stored Procedures / Triggers
                       ▼
┌────────────────────────────────────────────┐
│                DATA LAYER                  │
│             MySQL 8.0 (InnoDB)             │
│ 23 Tables | 3NF | ACID Transactions        │
└────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
DBMS/
│
├── database/
│   ├── 00_run_all_phase1.sql       # Master batch runner for Phase 1
│   ├── 01_create_database.sql      # Database initialization (quickkart_db, utf8mb4)
│   ├── 02_create_tables.sql        # 23 relational tables across 8 domains in 3NF
│   ├── 03_constraints_indexes.sql  # High-performance indexes for lookups & joins
│   ├── 04_sample_data.sql          # Seed dataset (Chennai dark stores, catalogue, fleet)
│   └── run_migration.js            # Automated Node.js execution script
│
├── documentation/
│   ├── ER_Diagram.md               # Mermaid ER diagram & domain model
│   ├── Relational_Schema.md        # Complete Data Dictionary with types and constraints
│   └── Normalization.md            # Formal 1NF, 2NF, 3NF mathematical justification
│
├── backend/                        # (Phase 3) Express API server & MySQL pool
├── frontend/                       # (Phase 4) React responsive web interfaces
├── steps.txt                       # Project blueprint & milestones
├── package.json                    # Project configuration
└── README.md                       # Project overview
```

---

## 🚀 Phase 1: Database Foundation (Completed)

All 23 relational tables across 8 logical domains have been designed and implemented in strict **Third Normal Form (3NF)** with full referential integrity and checks:

1. **Domain A (Identity & Customers):** `roles`, `users`, `addresses`
2. **Domain B (Product Catalogue):** `categories`, `brands`, `products`, `product_variants`
3. **Domain C (Dark Stores & Inventory):** `dark_stores`, `store_inventory`, `inventory_transactions`
4. **Domain D (Shopping Cart & Orders):** `carts`, `cart_items`, `orders`, `order_items`, `order_status_history`
5. **Domain E (Stock Reservations):** `stock_reservations`
6. **Domain F (Payments & Refunds):** `payments`, `refunds`
7. **Domain G (Delivery Management):** `delivery_partners`, `deliveries`, `delivery_status_history`
8. **Domain H (Store Stock Transfers):** `stock_transfers`, `stock_transfer_items`

---

## ⚡ How to Run Phase 1 Migration

### Method 1: Using the Node.js runner
```bash
# If password is set in .env or via CLI:
node database/run_migration.js --password=YOUR_PASSWORD
```

### Method 2: Running SQL Queries directly from your IDE Terminal
Run inline queries, explore tables, or enter an interactive SQL REPL:
```bash
# Run any SQL query (auto-loads credentials from .env)
node query.js "SELECT * FROM roles;"
npm run sql -- "SELECT * FROM dark_stores;"

# Quick table inspector
node query.js --table=products
node query.js "tables"
node query.js "desc users"

# Interactive SQL Shell (REPL)
node query.js
# or
npm run sql:repl

# Run complete SQL script files
node query.js database/09_test_queries.sql
```
See the full guide in [documentation/Terminal_SQL_Guide.md](file:///c:/Users/hydro/Documents/DBMS/documentation/Terminal_SQL_Guide.md).

### Method 3: Direct MySQL CLI
```bash
mysql -u root -p < database/00_run_all_phase1.sql
```

### Method 3: MySQL Workbench
Open and execute:
1. `database/01_create_database.sql`
2. `database/02_create_tables.sql`
3. `database/03_constraints_indexes.sql`
4. `database/04_sample_data.sql`
