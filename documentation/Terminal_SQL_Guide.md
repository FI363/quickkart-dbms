# How to Run SQL Queries from the IDE Terminal

This project provides multiple ways to run SQL queries directly inside your IDE terminal (PowerShell, Command Prompt, or bash) without manually typing MySQL passwords or navigating directory paths.

The database connection automatically loads configuration from your [`.env`](file:///c:/Users/hydro/Documents/DBMS/.env) file (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).

---

## Method 1: Using `node query.js` or `npm run sql` (Fastest & Cross-Platform)

We built an integrated query tool [`query.js`](file:///c:/Users/hydro/Documents/DBMS/query.js) that formats output into clean tables directly in the terminal.

### 1. Run an Inline SQL Query
Pass any query string as an argument:

```powershell
node query.js "SELECT * FROM roles;"
```
Or via npm:
```powershell
npm run sql -- "SELECT store_id, store_name, area FROM dark_stores;"
```

### 2. Inspect a Table (Quick Shortcut)
Quickly preview the first 20 rows of any table:
```powershell
node query.js --table=products
node query.js --table=orders
```

### 3. Quick Table List & Schema Describe
```powershell
node query.js "tables"
node query.js "desc users"
node query.js "desc store_inventory"
```

### 4. Execute an Entire `.sql` File
Run any SQL script file (such as migration scripts or test queries):
```powershell
node query.js database/09_test_queries.sql
```

---

## Method 2: Interactive SQL Shell (REPL)

To enter an interactive prompt where you can run queries one after another:

```powershell
node query.js
```
or
```powershell
npm run sql:repl
```

You will see:
```text
====================================================================
QuickKart Interactive SQL Shell — Connected to quickkart_db on 127.0.0.1:3306
Type any SQL query (e.g. SELECT * FROM users LIMIT 5;)
Shortcuts: tables | desc <table_name> | clear | exit
====================================================================

quickkart_db> SELECT user_id, full_name, email FROM users LIMIT 3;
quickkart_db> tables;
quickkart_db> desc deliveries;
quickkart_db> exit
```

Multi-line queries are supported: if you press Enter without a semicolon `;`, the prompt changes to `    -> ` until you type `;`.

---

## Method 3: Using the Dedicated Scripts (`mysql-cli.ps1` & `mysql-cli.cmd`)

Pre-configured launcher scripts are located in the project root:

### In PowerShell:
```powershell
# 1. Run an inline query:
.\mysql-cli.ps1 "SELECT order_id, order_number, total_amount, order_status FROM orders;"

# 2. Run a .sql file:
.\mysql-cli.ps1 database/09_test_queries.sql

# 3. Open the native MySQL console:
.\mysql-cli.ps1
```

### In Windows Command Prompt (`cmd.exe`):
```cmd
REM Run inline query:
mysql-cli.cmd "SELECT * FROM delivery_partners;"

REM Open native MySQL client:
mysql-cli.cmd
```

---

## Method 4: Directly Using Native `mysql.exe`

If you prefer the standard MySQL CLI binary installed on your machine (`C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe`):

### 1. Run an Inline Query:
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p"MyNewPassword123!" quickkart_db -e "SELECT * FROM roles;"
```

### 2. Enter the Native Interactive Client:
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p"MyNewPassword123!" quickkart_db
```

### 3. Add `mysql` to Your PowerShell Profile (Optional Convenience)
If you want to type `mysql` anywhere without the full path, run this in PowerShell once:
```powershell
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Program Files\MySQL\MySQL Server 8.0\bin", "User")
```
Then restart your terminal, and you can run:
```powershell
mysql -u root -p quickkart_db
```

---

## Summary of Commands

| Task | Command |
| :--- | :--- |
| **Run query** | `node query.js "SELECT * FROM <table_name>;"` |
| **Run via npm** | `npm run sql -- "SELECT * FROM <table_name>;"` |
| **Interactive shell** | `node query.js` or `npm run sql:repl` |
| **Show all tables** | `node query.js "tables"` |
| **Describe table** | `node query.js "desc <table_name>"` |
| **Run script file** | `node query.js database/<file>.sql` |
| **Native MySQL CLI** | `.\mysql-cli.ps1` |

