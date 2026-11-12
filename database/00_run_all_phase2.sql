-- ============================================================================
-- QuickKart: Quick-Commerce Management System
-- Script: 00_run_all_phase2.sql
-- Description: Master batch runner for Phase 2 DBMS Implementation:
--              Views, Functions, Stored Procedures, Triggers, and Tests
-- Usage: mysql -u root -p < database/00_run_all_phase2.sql
-- ============================================================================

USE quickkart_db;

SOURCE 05_views.sql;
SOURCE 06_functions.sql;
SOURCE 07_procedures.sql;
SOURCE 08_triggers.sql;
SOURCE 09_test_queries.sql;

SELECT '====================================================' AS Divider;
SELECT 'Phase 2: Advanced DBMS Implementation Complete!' AS Status;
SELECT '====================================================' AS Divider;

-- Verification of programmable objects in quickkart_db
SELECT 'Views Created' AS Object_Type, COUNT(*) AS Count 
FROM information_schema.views 
WHERE table_schema = 'quickkart_db'
UNION ALL
SELECT 'Stored Procedures', COUNT(*) 
FROM information_schema.routines 
WHERE routine_schema = 'quickkart_db' AND routine_type = 'PROCEDURE'
UNION ALL
SELECT 'Stored Functions', COUNT(*) 
FROM information_schema.routines 
WHERE routine_schema = 'quickkart_db' AND routine_type = 'FUNCTION'
UNION ALL
SELECT 'Triggers Registered', COUNT(*) 
FROM information_schema.triggers 
WHERE trigger_schema = 'quickkart_db';
