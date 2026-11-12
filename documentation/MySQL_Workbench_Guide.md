# Opening & Executing Project SQL Files in MySQL Workbench

This guide walks you through connecting MySQL Workbench to your local database and opening or executing the SQL scripts from this project.

---

## 1. Connection Details for MySQL Workbench

When you launch MySQL Workbench, click your connection (usually **Local instance MySQL80**), or create a new connection with these parameters from your [`.env`](file:///c:/Users/hydro/Documents/DBMS/.env) file:

| Parameter | Value |
| :--- | :--- |
| **Hostname** | `127.0.0.1` (or `localhost`) |
| **Port** | `3306` |
| **Username** | `root` |
| **Password** | `MyNewPassword123!` |
| **Default Schema** | `quickkart_db` |

---

## 2. Where the SQL Files Are Located

All database SQL files are stored in your project's `database/` folder:

```text
C:\Users\hydro\Documents\DBMS\database\
```

| File Name | Purpose | Execution Order |
| :--- | :--- | :--- |
| **`01_create_database.sql`** | Creates `quickkart_db` database and character sets | 1 |
| **`02_create_tables.sql`** | Creates all 23 core tables in 3NF | 2 |
| **`03_constraints_indexes.sql`**| Adds secondary indexes and foreign key indexes | 3 |
| **`04_sample_data.sql`** | Populates realistic seed data | 4 |
| **`05_views.sql`** | Creates operational and analytical SQL views | 5 |
| **`06_functions.sql`** | Creates deterministic functions (Haversine, stock count) | 6 |
| **`07_procedures.sql`** | Creates ACID stored procedures (checkout, restock, transfer) | 7 |
| **`08_triggers.sql`** | Business logic & audit timeline triggers | 8 |
| **`09_test_queries.sql`** | Verifies stored procedures and views | 9 |

---

## 3. Step-by-Step: How to Open and Run in Workbench

### Step 1: Open the SQL File in Workbench
1. In MySQL Workbench, go to the top menu: **File** ➔ **Open SQL Script...** (or press `Ctrl + Shift + O`).
2. Paste this path into the file dialog:
   ```text
   C:\Users\hydro\Documents\DBMS\database
   ```
3. Select the file you want to inspect or run (e.g. `02_create_tables.sql` or `09_test_queries.sql`).

---

### Step 2: Set the Active Schema
In the query tab, ensure `quickkart_db` is active. You can do this in two ways:
* **Option A:** Double-click **`quickkart_db`** in the left **SCHEMAS** panel so its name turns **bold**.
* **Option B:** Make sure the first line of the script contains:
  ```sql
  USE quickkart_db;
  ```

---

### Step 3: Execute the Script
MySQL Workbench gives you two execution buttons on the SQL editor toolbar:

1. **Execute All (Lightning Bolt ⚡ without cursor):**
   * Keyboard shortcut: **`Ctrl + Shift + Enter`**
   * Runs the entire open `.sql` script from top to bottom.
2. **Execute Current Line / Selection (Lightning Bolt with cursor ⚡):**
   * Keyboard shortcut: **`Ctrl + Enter`**
   * Highlights and runs only the specific SQL statement where your cursor is placed.

---

## 4. Run Everything in One Go (Master Scripts)

If you want to execute all Phase 1 or Phase 2 files without opening each one individually, Workbench can run the master batch scripts:

* **Phase 1 Master (Tables, Indexes, Seed Data):**
  Open `database/00_run_all_phase1.sql` and press `Ctrl + Shift + Enter`.
* **Phase 2 Master (Views, Functions, Procedures, Triggers, Tests):**
  Open `database/00_run_all_phase2.sql` and press `Ctrl + Shift + Enter`.

---

## 5. How to View Your Tables & Data in Workbench

After running the scripts:
1. In the left sidebar under **SCHEMAS**, click the refresh icon (🔄) next to the word **SCHEMAS**.
2. Expand **`quickkart_db`**:
   * Expand **Tables** ➔ Right-click any table (e.g. `users`, `products`, `orders`) ➔ click **Select Rows - Limit 1000**.
   * Expand **Views** ➔ View analytical views like `vw_available_products` and `vw_daily_store_sales`.
   * Expand **Stored Procedures** ➔ View procedures like `sp_place_order`, `sp_add_inventory`, etc.
3. You will see the results grid displayed at the bottom of Workbench.

