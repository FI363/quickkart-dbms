-- ============================================================================
-- QuickKart: Quick-Commerce Management System
-- Script: 01_create_database.sql
-- Description: Creates the quickkart_db database with UTF-8 character encoding
-- ============================================================================

-- Drop database if it exists (for clean environment setup)
-- Note: Comment out DROP DATABASE in production
DROP DATABASE IF EXISTS quickkart_db;

-- Create database with full Unicode support (utf8mb4)
CREATE DATABASE quickkart_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Select the database for active session
USE quickkart_db;

SELECT 'quickkart_db database created successfully!' AS Status;
