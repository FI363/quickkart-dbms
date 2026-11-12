-- ============================================================================
-- QuickKart: Quick-Commerce Management System
-- Script: 00_run_all_phase1.sql
-- Description: Master batch runner for Phase 1 database initialization
-- Usage: mysql -u root -p < database/00_run_all_phase1.sql
-- ============================================================================

SOURCE 01_create_database.sql;
SOURCE 02_create_tables.sql;
SOURCE 03_constraints_indexes.sql;
SOURCE 04_sample_data.sql;

-- Verification summary
SELECT 'Table count in quickkart_db:' AS Check_Item, COUNT(*) AS Value 
FROM information_schema.tables 
WHERE table_schema = 'quickkart_db' AND table_type = 'BASE TABLE';

SELECT 'Sample dark stores:' AS Check_Item, COUNT(*) AS Value FROM quickkart_db.dark_stores;
SELECT 'Sample products:' AS Check_Item, COUNT(*) AS Value FROM quickkart_db.products;
SELECT 'Sample product variants (SKUs):' AS Check_Item, COUNT(*) AS Value FROM quickkart_db.product_variants;
SELECT 'Sample inventory rows:' AS Check_Item, COUNT(*) AS Value FROM quickkart_db.store_inventory;
SELECT 'Sample orders placed:' AS Check_Item, COUNT(*) AS Value FROM quickkart_db.orders;
