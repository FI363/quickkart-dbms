-- ============================================================================
-- QuickKart: Quick-Commerce Management System
-- Script: 04_sample_data.sql
-- Description: Comprehensive realistic seed dataset modeled on Chennai 
--              quick-commerce operations (Dark stores, catalogue, inventory,
--              customers, carts, orders, payments, fleet, transfers).
-- ============================================================================

USE quickkart_db;

-- Temporarily disable FK checks to ensure safe multi-table ingestion
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE stock_transfer_items;
TRUNCATE TABLE stock_transfers;
TRUNCATE TABLE delivery_status_history;
TRUNCATE TABLE deliveries;
TRUNCATE TABLE delivery_partners;
TRUNCATE TABLE refunds;
TRUNCATE TABLE payments;
TRUNCATE TABLE stock_reservations;
TRUNCATE TABLE order_status_history;
TRUNCATE TABLE order_items;
TRUNCATE TABLE orders;
TRUNCATE TABLE cart_items;
TRUNCATE TABLE carts;
TRUNCATE TABLE inventory_transactions;
TRUNCATE TABLE store_inventory;
TRUNCATE TABLE dark_stores;
TRUNCATE TABLE product_variants;
TRUNCATE TABLE products;
TRUNCATE TABLE brands;
TRUNCATE TABLE categories;
TRUNCATE TABLE addresses;
TRUNCATE TABLE users;
TRUNCATE TABLE roles;

SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- 1. ROLES
-- ----------------------------------------------------------------------------
INSERT INTO roles (role_id, role_name, description) VALUES
(1, 'ADMIN', 'Super administrator with system-wide analytics, store & catalogue management'),
(2, 'STORE_MANAGER', 'Store level inventory control, fulfillment, and local stock replenishment'),
(3, 'DELIVERY_PARTNER', 'Last-mile delivery rider assigned to active orders'),
(4, 'CUSTOMER', 'End-user placing grocery orders for 10-15 min delivery');

-- ----------------------------------------------------------------------------
-- 2. USERS
-- (Passwords hashed with standard bcrypt demo hashes: password123)
-- ----------------------------------------------------------------------------
INSERT INTO users (user_id, role_id, full_name, email, phone, password_hash, account_status, created_at) VALUES
-- Admin
(1, 1, 'Farhaan Admin', 'admin@quickkart.in', '+919840111111', '$2b$10$wN9iL6U4zK6yW0P0m0V0Q.F1pX1X2X3X4X5X6X7X8X9X0X1X2X3X4', 'ACTIVE', '2026-01-01 08:00:00'),

-- Store Managers (one for each Chennai Dark Store)
(2, 2, 'Karthik Raman', 'karthik.tnagar@quickkart.in', '+919840222221', '$2b$10$wN9iL6U4zK6yW0P0m0V0Q.F1pX1X2X3X4X5X6X7X8X9X0X1X2X3X4', 'ACTIVE', '2026-01-05 09:00:00'),
(3, 2, 'Priya Sundaram', 'priya.adyar@quickkart.in', '+919840222222', '$2b$10$wN9iL6U4zK6yW0P0m0V0Q.F1pX1X2X3X4X5X6X7X8X9X0X1X2X3X4', 'ACTIVE', '2026-01-05 09:00:00'),
(4, 2, 'Venkatesh Babu', 'venkat.velachery@quickkart.in', '+919840222223', '$2b$10$wN9iL6U4zK6yW0P0m0V0Q.F1pX1X2X3X4X5X6X7X8X9X0X1X2X3X4', 'ACTIVE', '2026-01-05 09:00:00'),
(5, 2, 'Ananya Krishnan', 'ananya.annanagar@quickkart.in', '+919840222224', '$2b$10$wN9iL6U4zK6yW0P0m0V0Q.F1pX1X2X3X4X5X6X7X8X9X0X1X2X3X4', 'ACTIVE', '2026-01-05 09:00:00'),

-- Delivery Partners
(6, 3, 'Murugan Selvam', 'murugan.del@quickkart.in', '+919840333331', '$2b$10$wN9iL6U4zK6yW0P0m0V0Q.F1pX1X2X3X4X5X6X7X8X9X0X1X2X3X4', 'ACTIVE', '2026-01-10 10:00:00'),
(7, 3, 'Senthil Kumar', 'senthil.del@quickkart.in', '+919840333332', '$2b$10$wN9iL6U4zK6yW0P0m0V0Q.F1pX1X2X3X4X5X6X7X8X9X0X1X2X3X4', 'ACTIVE', '2026-01-10 10:00:00'),
(8, 3, 'Rajesh Pandian', 'rajesh.del@quickkart.in', '+919840333333', '$2b$10$wN9iL6U4zK6yW0P0m0V0Q.F1pX1X2X3X4X5X6X7X8X9X0X1X2X3X4', 'ACTIVE', '2026-01-10 10:00:00'),
(9, 3, 'Dinesh V', 'dinesh.del@quickkart.in', '+919840333334', '$2b$10$wN9iL6U4zK6yW0P0m0V0Q.F1pX1X2X3X4X5X6X7X8X9X0X1X2X3X4', 'ACTIVE', '2026-01-10 10:00:00'),
(10, 3, 'Vijay Anand', 'vijay.del@quickkart.in', '+919840333335', '$2b$10$wN9iL6U4zK6yW0P0m0V0Q.F1pX1X2X3X4X5X6X7X8X9X0X1X2X3X4', 'ACTIVE', '2026-01-10 10:00:00'),
(11, 3, 'Manoj Prabakar', 'manoj.del@quickkart.in', '+919840333336', '$2b$10$wN9iL6U4zK6yW0P0m0V0Q.F1pX1X2X3X4X5X6X7X8X9X0X1X2X3X4', 'ACTIVE', '2026-01-10 10:00:00'),

-- Customers
(12, 4, 'Aravind Swaminathan', 'aravind@gmail.com', '+919840444441', '$2b$10$wN9iL6U4zK6yW0P0m0V0Q.F1pX1X2X3X4X5X6X7X8X9X0X1X2X3X4', 'ACTIVE', '2026-01-15 11:00:00'),
(13, 4, 'Divya Natarajan', 'divya.n@gmail.com', '+919840444442', '$2b$10$wN9iL6U4zK6yW0P0m0V0Q.F1pX1X2X3X4X5X6X7X8X9X0X1X2X3X4', 'ACTIVE', '2026-01-16 11:30:00'),
(14, 4, 'Ganesh Moorthy', 'ganesh.m@gmail.com', '+919840444443', '$2b$10$wN9iL6U4zK6yW0P0m0V0Q.F1pX1X2X3X4X5X6X7X8X9X0X1X2X3X4', 'ACTIVE', '2026-01-18 14:15:00'),
(15, 4, 'Keerthana Ravichandran', 'keerthi.r@gmail.com', '+919840444444', '$2b$10$wN9iL6U4zK6yW0P0m0V0Q.F1pX1X2X3X4X5X6X7X8X9X0X1X2X3X4', 'ACTIVE', '2026-01-20 16:40:00'),
(16, 4, 'Siddharth Iyer', 'siddharth@gmail.com', '+919840444445', '$2b$10$wN9iL6U4zK6yW0P0m0V0Q.F1pX1X2X3X4X5X6X7X8X9X0X1X2X3X4', 'ACTIVE', '2026-01-22 18:20:00'),
(17, 4, 'Deepika Balaji', 'deepika.b@gmail.com', '+919840444446', '$2b$10$wN9iL6U4zK6yW0P0m0V0Q.F1pX1X2X3X4X5X6X7X8X9X0X1X2X3X4', 'ACTIVE', '2026-01-25 08:45:00'),
(18, 4, 'Naveen Joseph', 'naveen.j@gmail.com', '+919840444447', '$2b$10$wN9iL6U4zK6yW0P0m0V0Q.F1pX1X2X3X4X5X6X7X8X9X0X1X2X3X4', 'ACTIVE', '2026-01-28 12:10:00'),
(19, 4, 'Sneha Raghavan', 'sneha.r@gmail.com', '+919840444448', '$2b$10$wN9iL6U4zK6yW0P0m0V0Q.F1pX1X2X3X4X5X6X7X8X9X0X1X2X3X4', 'ACTIVE', '2026-02-01 10:05:00');

-- ----------------------------------------------------------------------------
-- 3. ADDRESSES (Chennai Localities)
-- ----------------------------------------------------------------------------
INSERT INTO addresses (address_id, user_id, address_line, area, city, state, pincode, latitude, longitude, address_type, is_default) VALUES
(1, 12, 'Flat 3B, Ceebros Heights, 12 Pondy Bazaar', 'T. Nagar', 'Chennai', 'Tamil Nadu', '600017', 13.0405000, 80.2337000, 'HOME', TRUE),
(2, 12, 'Tidel Park, 4th Floor, Rajiv Gandhi Salai', 'Taramani', 'Chennai', 'Tamil Nadu', '600113', 12.9892000, 80.2484000, 'WORK', FALSE),
(3, 13, '24, 2nd Main Road, Gandhi Nagar', 'Adyar', 'Chennai', 'Tamil Nadu', '600020', 13.0063000, 80.2575000, 'HOME', TRUE),
(4, 14, '56/2, 100 Feet Bypass Road', 'Velachery', 'Chennai', 'Tamil Nadu', '600042', 12.9789000, 80.2198000, 'HOME', TRUE),
(5, 15, 'D-14, 3rd Avenue, Shanthi Colony', 'Anna Nagar', 'Chennai', 'Tamil Nadu', '600040', 13.0858000, 80.2112000, 'HOME', TRUE),
(6, 16, '18, Luz Church Road', 'Mylapore', 'Chennai', 'Tamil Nadu', '600004', 13.0335000, 80.2642000, 'HOME', TRUE),
(7, 16, 'Olympia Tech Park, Guindy', 'Guindy', 'Chennai', 'Tamil Nadu', '600032', 13.0094000, 80.2085000, 'WORK', FALSE),
(8, 17, '89, TTK Road', 'Alwarpet', 'Chennai', 'Tamil Nadu', '600018', 13.0348000, 80.2520000, 'HOME', TRUE),
(9, 18, '102, Kothari Road', 'Nungambakkam', 'Chennai', 'Tamil Nadu', '600034', 13.0582000, 80.2421000, 'HOME', TRUE),
(10, 19, '33, 4th Seaward Road, Valmiki Nagar', 'Thiruvanmiyur', 'Chennai', 'Tamil Nadu', '600041', 12.9820000, 80.2625000, 'HOME', TRUE);

-- ----------------------------------------------------------------------------
-- 4. CATEGORIES (Hierarchical: Parents & Children)
-- ----------------------------------------------------------------------------
INSERT INTO categories (category_id, parent_category_id, category_name, slug, description) VALUES
-- Root Categories
(1, NULL, 'Dairy & Breakfast', 'dairy-breakfast', 'Milk, curd, butter, paneer, eggs and breads'),
(2, NULL, 'Fruits & Vegetables', 'fruits-vegetables', 'Fresh farm-picked fruits and green vegetables'),
(3, NULL, 'Snacks & Munchies', 'snacks-munchies', 'Chips, namkeen, biscuits, cookies, chocolates'),
(4, NULL, 'Beverages', 'beverages', 'Cold drinks, juices, instant mixes, tea and coffee'),
(5, NULL, 'Cleaning & Household', 'cleaning-household', 'Detergents, floor cleaners, kitchen essentials'),

-- Child Categories under Dairy & Breakfast (1)
(6, 1, 'Milk & Cream', 'milk-cream', 'Fresh pouch milk, UHT milk and fresh cream'),
(7, 1, 'Curd & Paneer', 'curd-paneer', 'Fresh set curd, yogurt and malai paneer'),
(8, 1, 'Bread & Eggs', 'bread-eggs', 'Brown bread, white bread and farm eggs'),

-- Child Categories under Fruits & Vegetables (2)
(9, 2, 'Fresh Vegetables', 'fresh-vegetables', 'Potatoes, onions, tomatoes and greens'),
(10, 2, 'Fresh Fruits', 'fresh-fruits', 'Bananas, apples, oranges, seasonal fruits'),

-- Child Categories under Snacks & Munchies (3)
(11, 3, 'Chips & Crisps', 'chips-crisps', 'Potato chips, corn puffs and nachos'),
(12, 3, 'Biscuits & Cookies', 'biscuits-cookies', 'Digestive biscuits, cookies, cream wafers'),

-- Child Categories under Beverages (4)
(13, 4, 'Cold Drinks & Sodas', 'cold-drinks', 'Aerated soft drinks, sodas, and mocktails'),
(14, 4, 'Tea & Coffee', 'tea-coffee', 'Filter coffee powders and premium tea blends'),

-- Child Categories under Cleaning (5)
(15, 5, 'Detergents & Laundry', 'detergents-laundry', 'Detergent powders and liquid washes');

-- ----------------------------------------------------------------------------
-- 5. BRANDS
-- ----------------------------------------------------------------------------
INSERT INTO brands (brand_id, brand_name, description) VALUES
(1, 'Amul', 'The Taste of India — dairy cooperatives'),
(2, 'Aavin', 'Tamil Nadu Co-operative Milk Producers Federation'),
(3, 'Nandini', 'Karnataka Milk Federation'),
(4, 'Britannia', 'Leading bakery and biscuit brand'),
(5, 'Parle', 'Beloved Indian biscuits and snacks'),
(6, 'Lay''s', 'World-famous potato chips brand'),
(7, 'Haldiram''s', 'Authentic Indian sweets and traditional namkeens'),
(8, 'Coca-Cola', 'Global beverage giant'),
(9, 'Tata', 'Tata Tea and Consumer Products'),
(10, 'Cadbury', 'Chocolates and confectionery'),
(11, 'Surf Excel', 'Premium laundry detergents'),
(12, 'Farm Fresh', 'Directly sourced farm fresh produce');

-- ----------------------------------------------------------------------------
-- 6. PRODUCTS
-- ----------------------------------------------------------------------------
INSERT INTO products (product_id, category_id, brand_id, product_name, description, image_url, is_active) VALUES
(1, 6, 1, 'Amul Taaza Homogenised Toned Milk', 'Fresh toned milk, pasteurized and homogenized', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=300&q=80', TRUE),
(2, 6, 2, 'Aavin Green Magic Toned Milk', 'Rich and tasty toned pouch milk from Aavin', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=300&q=80', TRUE),
(3, 7, 1, 'Amul Malai Paneer', 'Soft, rich and creamy cottage cheese cubes', 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=300&q=80', TRUE),
(4, 7, 1, 'Amul Masti Dahi', 'Thick, creamy set curd with zero preservatives', 'https://images.unsplash.com/photo-1588710929895-5e6383b4b574?auto=format&fit=crop&w=300&q=80', TRUE),
(5, 8, 4, 'Britannia Whole Wheat Bread', '100% whole wheat sliced brown sandwich bread', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80', TRUE),
(6, 8, 12, 'Farm Fresh White Eggs', 'Healthy protein-packed farm fresh white eggs', 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=300&q=80', TRUE),
(7, 9, 12, 'Farm Fresh Hybrid Tomatoes', 'Glossy red, ripe and juicy cooking tomatoes', 'https://images.unsplash.com/photo-1546470427-227c7369a94d?auto=format&fit=crop&w=300&q=80', TRUE),
(8, 9, 12, 'New Crop Baby Potatoes', 'Fresh earthy golden potatoes for curries and fries', 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=300&q=80', TRUE),
(9, 9, 12, 'Fresh Red Onions', 'Crisp pungent red onions essential for daily cooking', 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=300&q=80', TRUE),
(10, 10, 12, 'Robusta Yellow Bananas', 'Naturally ripened, sweet and potassium-rich bananas', 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=300&q=80', TRUE),
(11, 10, 12, 'Royal Gala Apples', 'Crisp, sweet imported gala apples', 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=300&q=80', TRUE),
(12, 11, 6, 'Lay''s Classic Salted Potato Chips', 'Crispy thin cut potato chips with light salt', 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=300&q=80', TRUE),
(13, 11, 6, 'Lay''s India''s Magic Masala Chips', 'Spicy blend of Indian spices coated on potato chips', 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=300&q=80', TRUE),
(14, 11, 7, 'Haldiram''s Bhujia Sev', 'Crispy spiced moth bean gram flour snack noodles', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=300&q=80', TRUE),
(15, 12, 5, 'Parle-G Original Gluco Biscuits', 'India''s favourite glucose biscuits since 1939', 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=300&q=80', TRUE),
(16, 12, 4, 'Britannia Good Day Butter Cookies', 'Rich buttery biscuits with joyful smiling patterns', 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=300&q=80', TRUE),
(17, 13, 8, 'Coca-Cola Zero Sugar', 'Great Coca-Cola refreshing taste with zero sugar', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=300&q=80', TRUE),
(18, 14, 9, 'Tata Tea Premium Blend', 'Desh Ki Chai — rich aromatic tea blend', 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=300&q=80', TRUE),
(19, 15, 11, 'Surf Excel Matic Front Load Detergent', 'Powerful stain removing liquid detergent', 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=300&q=80', TRUE);

-- ----------------------------------------------------------------------------
-- 7. PRODUCT VARIANTS (SKUs with Units and Prices)
-- ----------------------------------------------------------------------------
INSERT INTO product_variants (variant_id, product_id, sku, variant_name, unit, price, mrp, is_active) VALUES
(1, 1, 'AML-MLK-500', 'Amul Taaza 500 ml Pouch', '500 ml', 27.00, 28.00, TRUE),
(2, 1, 'AML-MLK-1000', 'Amul Taaza 1 Litre Tetra Pak', '1 Litre', 74.00, 78.00, TRUE),
(3, 2, 'AAV-MLK-500', 'Aavin Green Magic 500 ml Pouch', '500 ml', 22.00, 22.00, TRUE),
(4, 3, 'AML-PAN-200', 'Amul Malai Paneer 200g Block', '200 g', 92.00, 95.00, TRUE),
(5, 3, 'AML-PAN-500', 'Amul Malai Paneer 500g Block', '500 g', 215.00, 225.00, TRUE),
(6, 4, 'AML-DAH-400', 'Amul Masti Dahi 400g Cup', '400 g', 35.00, 35.00, TRUE),
(7, 5, 'BRT-BRD-400', 'Britannia Brown Bread 400g Loaf', '400 g', 45.00, 50.00, TRUE),
(8, 6, 'FF-EGG-6PK', 'Farm Fresh White Eggs Pack of 6', 'Pack of 6', 42.00, 48.00, TRUE),
(9, 6, 'FF-EGG-12PK', 'Farm Fresh White Eggs Pack of 12', 'Pack of 12', 80.00, 95.00, TRUE),
(10, 7, 'VEG-TOM-500', 'Fresh Hybrid Tomatoes 500g', '500 g', 18.00, 22.00, TRUE),
(11, 7, 'VEG-TOM-1000', 'Fresh Hybrid Tomatoes 1 kg', '1 kg', 34.00, 40.00, TRUE),
(12, 8, 'VEG-POT-1000', 'Baby Potatoes 1 kg', '1 kg', 32.00, 38.00, TRUE),
(13, 9, 'VEG-ONI-1000', 'Fresh Red Onions 1 kg', '1 kg', 42.00, 48.00, TRUE),
(14, 10, 'FRT-BAN-6PK', 'Robusta Bananas 6 pcs', '6 pcs', 36.00, 42.00, TRUE),
(15, 11, 'FRT-APP-4PK', 'Royal Gala Apples Pack of 4', '4 pcs', 145.00, 160.00, TRUE),
(16, 12, 'LYS-SLT-50', 'Lay''s Classic Salted 50g Pouch', '50 g', 20.00, 20.00, TRUE),
(17, 12, 'LYS-SLT-90', 'Lay''s Classic Salted Party Pack 90g', '90 g', 40.00, 40.00, TRUE),
(18, 13, 'LYS-MAS-50', 'Lay''s Magic Masala 50g Pouch', '50 g', 20.00, 20.00, TRUE),
(19, 14, 'HAL-BHJ-200', 'Haldiram''s Bhujia Sev 200g Pouch', '200 g', 55.00, 60.00, TRUE),
(20, 15, 'PAR-PRG-250', 'Parle-G Glucose Biscuits 250g Family Pack', '250 g', 25.00, 25.00, TRUE),
(21, 16, 'BRT-GDY-200', 'Britannia Good Day Butter 200g Pack', '200 g', 38.00, 40.00, TRUE),
(22, 17, 'COC-ZRO-750', 'Coca-Cola Zero Sugar 750 ml Bottle', '750 ml', 45.00, 45.00, TRUE),
(23, 18, 'TAT-TEA-500', 'Tata Tea Premium Blend 500g Pack', '500 g', 260.00, 280.00, TRUE),
(24, 19, 'SRF-MTC-1000', 'Surf Excel Matic Front Load Liquid 1L', '1 Litre', 230.00, 250.00, TRUE);

-- ----------------------------------------------------------------------------
-- 8. DARK STORES (Chennai Hubs)
-- ----------------------------------------------------------------------------
INSERT INTO dark_stores (store_id, store_name, address, area, city, pincode, latitude, longitude, service_radius_km, is_active) VALUES
(1, 'QuickKart T. Nagar Hub', '14, Burkit Road, T. Nagar', 'T. Nagar', 'Chennai', '600017', 13.0418000, 80.2341000, 4.50, TRUE),
(2, 'QuickKart Adyar Hub', '32, LB Road, Adyar', 'Adyar', 'Chennai', '600020', 13.0012000, 80.2565000, 5.00, TRUE),
(3, 'QuickKart Velachery Hub', '78, Velachery Bypass Road', 'Velachery', 'Chennai', '600042', 12.9815000, 80.2180000, 5.00, TRUE),
(4, 'QuickKart Anna Nagar Hub', '2nd Main Road, Anna Nagar West', 'Anna Nagar', 'Chennai', '600040', 13.0850000, 80.2101000, 4.00, TRUE);

-- ----------------------------------------------------------------------------
-- 9. STORE INVENTORY
-- (Seeded across stores with varied quantities, some low-stock items for alert triggers)
-- ----------------------------------------------------------------------------
INSERT INTO store_inventory (inventory_id, store_id, variant_id, total_quantity, reserved_quantity, reorder_level, updated_at) VALUES
-- Store 1: T. Nagar Hub
(1, 1, 1, 120, 2, 20, NOW()),  -- Amul Milk 500ml
(2, 1, 2, 60, 0, 15, NOW()),   -- Amul Milk 1L
(3, 1, 3, 150, 4, 30, NOW()),  -- Aavin Milk 500ml
(4, 1, 4, 45, 1, 10, NOW()),   -- Paneer 200g
(5, 1, 6, 80, 0, 15, NOW()),   -- Dahi 400g
(6, 1, 7, 70, 2, 15, NOW()),   -- Bread
(7, 1, 8, 90, 0, 20, NOW()),   -- Eggs 6pk
(8, 1, 10, 50, 0, 15, NOW()),  -- Tomatoes 500g
(9, 1, 12, 85, 0, 20, NOW()),  -- Potatoes 1kg
(10, 1, 13, 95, 0, 20, NOW()), -- Onions 1kg
(11, 1, 16, 120, 0, 25, NOW()),-- Lays Salted 50g
(12, 1, 18, 110, 0, 25, NOW()),-- Lays Masala 50g
(13, 1, 20, 200, 0, 30, NOW()),-- Parle-G
(14, 1, 22, 60, 0, 15, NOW()), -- Coke Zero
(15, 1, 23, 8, 0, 10, NOW()),  -- Tata Tea (Low Stock! total 8 <= reorder 10)

-- Store 2: Adyar Hub
(16, 2, 1, 90, 0, 20, NOW()),
(17, 2, 3, 130, 0, 25, NOW()),
(18, 2, 4, 5, 0, 10, NOW()),   -- Low stock paneer
(19, 2, 7, 50, 0, 15, NOW()),
(20, 2, 8, 65, 0, 15, NOW()),
(21, 2, 10, 40, 0, 15, NOW()),
(22, 2, 13, 75, 0, 20, NOW()),
(23, 2, 16, 100, 0, 20, NOW()),
(24, 2, 20, 150, 0, 25, NOW()),
(25, 2, 24, 30, 0, 10, NOW()),

-- Store 3: Velachery Hub
(26, 3, 1, 80, 0, 20, NOW()),
(27, 3, 3, 100, 0, 20, NOW()),
(28, 3, 4, 30, 0, 10, NOW()),
(29, 3, 6, 40, 0, 10, NOW()),
(30, 3, 7, 45, 0, 15, NOW()),
(31, 3, 8, 55, 0, 15, NOW()),
(32, 3, 11, 35, 0, 10, NOW()),
(33, 3, 12, 60, 0, 15, NOW()),
(34, 3, 16, 80, 0, 20, NOW()),
(35, 3, 19, 4, 0, 10, NOW()),  -- Low stock Bhujia

-- Store 4: Anna Nagar Hub
(36, 4, 1, 140, 0, 25, NOW()),
(37, 4, 2, 80, 0, 15, NOW()),
(38, 4, 3, 160, 0, 30, NOW()),
(39, 4, 4, 50, 0, 10, NOW()),
(40, 4, 7, 90, 0, 20, NOW()),
(41, 4, 8, 110, 0, 20, NOW()),
(42, 4, 10, 70, 0, 15, NOW()),
(43, 4, 13, 85, 0, 20, NOW()),
(44, 4, 18, 120, 0, 25, NOW()),
(45, 4, 23, 40, 0, 10, NOW());

-- ----------------------------------------------------------------------------
-- 10. INVENTORY AUDIT TRANSACTIONS (Initial Inward Stock)
-- ----------------------------------------------------------------------------
INSERT INTO inventory_transactions (transaction_id, inventory_id, transaction_type, quantity_change, previous_quantity, new_quantity, reference_id, notes, created_at) VALUES
(1, 1, 'RESTOCK', 120, 0, 120, NULL, 'Initial store opening inward replenishment', '2026-01-15 06:00:00'),
(2, 3, 'RESTOCK', 150, 0, 150, NULL, 'Fresh morning dairy shipment from Aavin', '2026-01-15 06:30:00'),
(3, 4, 'RESTOCK', 45, 0, 45, NULL, 'Cold chain inward replenishment', '2026-01-15 07:00:00'),
(4, 15, 'RESTOCK', 15, 0, 15, NULL, 'Weekly FMCG dry stock restock', '2026-01-15 07:15:00'),
(5, 15, 'DAMAGE_ADJUSTMENT', -7, 15, 8, NULL, 'Water damaged packets discarded during audit', '2026-01-28 17:00:00');

-- ----------------------------------------------------------------------------
-- 11. DELIVERY FLEET (Partners)
-- ----------------------------------------------------------------------------
INSERT INTO delivery_partners (partner_id, user_id, vehicle_type, vehicle_number, current_latitude, current_longitude, availability_status, rating) VALUES
(1, 6, 'EV_SCOOTER', 'TN 09 BX 1234', 13.0420000, 80.2345000, 'AVAILABLE', 4.90),
(2, 7, 'BIKE', 'TN 07 CA 5678', 13.0015000, 80.2570000, 'AVAILABLE', 4.85),
(3, 8, 'EV_SCOOTER', 'TN 10 DF 9012', 12.9818000, 80.2185000, 'BUSY', 4.95),
(4, 9, 'SCOOTER', 'TN 02 EJ 3456', 13.0855000, 80.2105000, 'AVAILABLE', 4.75),
(5, 10, 'CYCLE', NULL, 13.0410000, 80.2330000, 'OFFLINE', 4.80),
(6, 11, 'EV_SCOOTER', 'TN 09 GH 7890', 13.0020000, 80.2560000, 'AVAILABLE', 5.00);

-- ----------------------------------------------------------------------------
-- 12. CARTS & CART ITEMS
-- ----------------------------------------------------------------------------
INSERT INTO carts (cart_id, user_id, store_id, cart_status, created_at) VALUES
(1, 16, 1, 'ACTIVE', NOW()),
(2, 17, 2, 'ACTIVE', NOW());

INSERT INTO cart_items (cart_item_id, cart_id, variant_id, quantity) VALUES
(1, 1, 1, 2), -- 2x Amul Milk 500ml
(2, 1, 7, 1), -- 1x Bread
(3, 2, 4, 1), -- 1x Paneer
(4, 2, 8, 1); -- 1x Eggs

-- ----------------------------------------------------------------------------
-- 13. ORDERS (Across Multiple Fulfillment States)
-- ----------------------------------------------------------------------------
INSERT INTO orders (order_id, user_id, store_id, address_id, order_number, delivery_address_snapshot, subtotal, delivery_fee, discount, total_amount, order_status, created_at) VALUES
-- Order 1: Delivered
(1, 12, 1, 1, 'ORD-2026-0001', 'Flat 3B, Ceebros Heights, 12 Pondy Bazaar, T. Nagar, Chennai - 600017', 153.00, 15.00, 10.00, 158.00, 'DELIVERED', '2026-02-02 08:30:00'),

-- Order 2: Delivered
(2, 13, 2, 3, 'ORD-2026-0002', '24, 2nd Main Road, Gandhi Nagar, Adyar, Chennai - 600020', 214.00, 0.00, 20.00, 194.00, 'DELIVERED', '2026-02-02 09:15:00'),

-- Order 3: Out For Delivery right now
(3, 14, 3, 4, 'ORD-2026-0003', '56/2, 100 Feet Bypass Road, Velachery, Chennai - 600042', 124.00, 15.00, 0.00, 139.00, 'OUT_FOR_DELIVERY', '2026-02-02 10:00:00'),

-- Order 4: Packing at Dark Store
(4, 15, 4, 5, 'ORD-2026-0004', 'D-14, 3rd Avenue, Shanthi Colony, Anna Nagar, Chennai - 600040', 275.00, 0.00, 25.00, 250.00, 'PACKING', '2026-02-02 10:10:00'),

-- Order 5: Confirmed, awaiting packing
(5, 12, 1, 1, 'ORD-2026-0005', 'Flat 3B, Ceebros Heights, 12 Pondy Bazaar, T. Nagar, Chennai - 600017', 99.00, 15.00, 0.00, 114.00, 'CONFIRMED', '2026-02-02 10:20:00'),

-- Order 6: Cancelled by customer
(6, 18, 1, 9, 'ORD-2026-0006', '102, Kothari Road, Nungambakkam, Chennai - 600034', 184.00, 15.00, 0.00, 199.00, 'CANCELLED', '2026-02-01 14:00:00');

-- ----------------------------------------------------------------------------
-- 14. ORDER ITEMS (With Name and Unit Price Snapshots)
-- ----------------------------------------------------------------------------
INSERT INTO order_items (order_item_id, order_id, variant_id, product_name_snapshot, variant_name_snapshot, quantity, unit_price, subtotal) VALUES
-- For Order 1
(1, 1, 1, 'Amul Taaza Homogenised Toned Milk', 'Amul Taaza 500 ml Pouch', 2, 27.00, 54.00),
(2, 1, 7, 'Britannia Whole Wheat Bread', 'Britannia Brown Bread 400g Loaf', 1, 45.00, 45.00),
(3, 1, 16, 'Lay''s Classic Salted Potato Chips', 'Lay''s Classic Salted 50g Pouch', 2, 20.00, 40.00),
(4, 1, 10, 'Farm Fresh Hybrid Tomatoes', 'Fresh Hybrid Tomatoes 500g', 1, 14.00, 14.00),

-- For Order 2
(5, 2, 4, 'Amul Malai Paneer', 'Amul Malai Paneer 200g Block', 1, 92.00, 92.00),
(6, 2, 8, 'Farm Fresh White Eggs', 'Farm Fresh White Eggs Pack of 6', 1, 42.00, 42.00),
(7, 2, 20, 'Parle-G Original Gluco Biscuits', 'Parle-G Glucose Biscuits 250g Family Pack', 2, 25.00, 50.00),
(8, 2, 14, 'Robusta Yellow Bananas', 'Robusta Bananas 6 pcs', 1, 30.00, 30.00),

-- For Order 3
(9, 3, 3, 'Aavin Green Magic Toned Milk', 'Aavin Green Magic 500 ml Pouch', 2, 22.00, 44.00),
(10, 3, 8, 'Farm Fresh White Eggs', 'Farm Fresh White Eggs Pack of 6', 1, 42.00, 42.00),
(11, 3, 16, 'Lay''s Classic Salted Potato Chips', 'Lay''s Classic Salted 50g Pouch', 1, 20.00, 20.00),
(12, 3, 18, 'Lay''s India''s Magic Masala Chips', 'Lay''s Magic Masala 50g Pouch', 1, 18.00, 18.00),

-- For Order 4
(13, 4, 23, 'Tata Tea Premium Blend', 'Tata Tea Premium Blend 500g Pack', 1, 260.00, 260.00),
(14, 4, 15, 'Royal Gala Apples', 'Royal Gala Apples Pack of 4', 1, 145.00, 145.00),

-- For Order 5
(15, 5, 1, 'Amul Taaza Homogenised Toned Milk', 'Amul Taaza 500 ml Pouch', 2, 27.00, 54.00),
(16, 5, 7, 'Britannia Whole Wheat Bread', 'Britannia Brown Bread 400g Loaf', 1, 45.00, 45.00),

-- For Order 6
(17, 6, 4, 'Amul Malai Paneer', 'Amul Malai Paneer 200g Block', 2, 92.00, 184.00);

-- ----------------------------------------------------------------------------
-- 15. ORDER STATUS HISTORY
-- ----------------------------------------------------------------------------
INSERT INTO order_status_history (history_id, order_id, previous_status, new_status, changed_at, remarks) VALUES
(1, 1, NULL, 'PENDING', '2026-02-02 08:30:00', 'Order placed by customer via UPI'),
(2, 1, 'PENDING', 'CONFIRMED', '2026-02-02 08:31:00', 'Payment verified and stock confirmed'),
(3, 1, 'CONFIRMED', 'PACKING', '2026-02-02 08:32:00', 'Picker assigned at T. Nagar hub'),
(4, 1, 'PACKING', 'OUT_FOR_DELIVERY', '2026-02-02 08:38:00', 'Bag handed over to rider Murugan'),
(5, 1, 'OUT_FOR_DELIVERY', 'DELIVERED', '2026-02-02 08:49:00', 'Delivered in 19 mins to customer doorstep'),

(6, 2, NULL, 'PENDING', '2026-02-02 09:15:00', 'Order placed via Credit Card'),
(7, 2, 'PENDING', 'CONFIRMED', '2026-02-02 09:16:00', 'Payment authorized'),
(8, 2, 'CONFIRMED', 'PACKING', '2026-02-02 09:17:00', 'Packed at Adyar dark store'),
(9, 2, 'PACKING', 'OUT_FOR_DELIVERY', '2026-02-02 09:22:00', 'Handed to rider Senthil'),
(10, 2, 'OUT_FOR_DELIVERY', 'DELIVERED', '2026-02-02 09:34:00', 'Delivered safely in 19 mins'),

(11, 3, NULL, 'PENDING', '2026-02-02 10:00:00', 'Order placed via UPI'),
(12, 3, 'PENDING', 'CONFIRMED', '2026-02-02 10:01:00', 'Payment confirmed'),
(13, 3, 'CONFIRMED', 'PACKING', '2026-02-02 10:02:00', 'Packed at Velachery store'),
(14, 3, 'PACKING', 'OUT_FOR_DELIVERY', '2026-02-02 10:07:00', 'Rider Rajesh on way to customer'),

(15, 4, NULL, 'PENDING', '2026-02-02 10:10:00', 'Order placed via Net Banking'),
(16, 4, 'PENDING', 'CONFIRMED', '2026-02-02 10:11:00', 'Payment confirmed'),
(17, 4, 'CONFIRMED', 'PACKING', '2026-02-02 10:12:00', 'Being picked from racks at Anna Nagar'),

(18, 5, NULL, 'PENDING', '2026-02-02 10:20:00', 'Order placed with COD'),
(19, 5, 'PENDING', 'CONFIRMED', '2026-02-02 10:20:30', 'Auto-confirmed COD order'),

(20, 6, NULL, 'PENDING', '2026-02-01 14:00:00', 'Order placed via UPI'),
(21, 6, 'PENDING', 'CONFIRMED', '2026-02-01 14:00:45', 'Payment confirmed'),
(22, 6, 'CONFIRMED', 'CANCELLED', '2026-02-01 14:05:00', 'Cancelled by customer: ordered by mistake');

-- ----------------------------------------------------------------------------
-- 16. STOCK RESERVATIONS
-- ----------------------------------------------------------------------------
INSERT INTO stock_reservations (reservation_id, order_id, variant_id, store_id, quantity, reservation_status, expires_at, created_at) VALUES
-- Order 1: Confirmed & fulfilled
(1, 1, 1, 1, 2, 'CONFIRMED', '2026-02-02 08:45:00', '2026-02-02 08:30:00'),
(2, 1, 7, 1, 1, 'CONFIRMED', '2026-02-02 08:45:00', '2026-02-02 08:30:00'),

-- Order 4: Active reservation during packing
(3, 4, 23, 4, 1, 'ACTIVE', '2026-02-02 10:30:00', '2026-02-02 10:10:00'),

-- Order 5: Active reservation
(4, 5, 1, 1, 2, 'ACTIVE', '2026-02-02 10:35:00', '2026-02-02 10:20:00'),
(5, 5, 7, 1, 1, 'ACTIVE', '2026-02-02 10:35:00', '2026-02-02 10:20:00'),

-- Order 6: Released on cancellation
(6, 6, 4, 1, 2, 'RELEASED', '2026-02-01 14:15:00', '2026-02-01 14:00:00');

-- ----------------------------------------------------------------------------
-- 17. PAYMENTS
-- ----------------------------------------------------------------------------
INSERT INTO payments (payment_id, order_id, transaction_reference, payment_method, amount, payment_status, paid_at, created_at) VALUES
(1, 1, 'TXN-UPI-20260202-849201', 'UPI', 158.00, 'SUCCESS', '2026-02-02 08:30:45', '2026-02-02 08:30:00'),
(2, 2, 'TXN-CRD-20260202-120485', 'CREDIT_CARD', 194.00, 'SUCCESS', '2026-02-02 09:15:30', '2026-02-02 09:15:00'),
(3, 3, 'TXN-UPI-20260202-993810', 'UPI', 139.00, 'SUCCESS', '2026-02-02 10:00:40', '2026-02-02 10:00:00'),
(4, 4, 'TXN-NB-20260202-440291', 'NET_BANKING', 250.00, 'SUCCESS', '2026-02-02 10:10:50', '2026-02-02 10:10:00'),
(5, 5, 'TXN-COD-20260202-550183', 'COD', 114.00, 'PENDING', NULL, '2026-02-02 10:20:00'),
(6, 6, 'TXN-UPI-20260201-772910', 'UPI', 199.00, 'REFUNDED', '2026-02-01 14:00:30', '2026-02-01 14:00:00');

-- ----------------------------------------------------------------------------
-- 18. REFUNDS
-- ----------------------------------------------------------------------------
INSERT INTO refunds (refund_id, payment_id, refund_reference, refund_amount, refund_reason, refund_status, created_at, processed_at) VALUES
(1, 6, 'RFND-20260201-998811', 199.00, 'Customer cancelled order prior to dispatch', 'PROCESSED', '2026-02-01 14:05:30', '2026-02-01 14:06:00');

-- ----------------------------------------------------------------------------
-- 19. DELIVERIES
-- ----------------------------------------------------------------------------
INSERT INTO deliveries (delivery_id, order_id, partner_id, delivery_status, assigned_at, picked_up_at, delivered_at, estimated_delivery_time, created_at) VALUES
(1, 1, 1, 'DELIVERED', '2026-02-02 08:35:00', '2026-02-02 08:38:00', '2026-02-02 08:49:00', '2026-02-02 08:50:00', '2026-02-02 08:31:00'),
(2, 2, 2, 'DELIVERED', '2026-02-02 09:18:00', '2026-02-02 09:22:00', '2026-02-02 09:34:00', '2026-02-02 09:35:00', '2026-02-02 09:16:00'),
(3, 3, 3, 'PICKED_UP', '2026-02-02 10:04:00', '2026-02-02 10:07:00', NULL, '2026-02-02 10:20:00', '2026-02-02 10:01:00'),
(4, 4, 4, 'ASSIGNED', '2026-02-02 10:13:00', NULL, NULL, '2026-02-02 10:28:00', '2026-02-02 10:11:00'),
(5, 5, NULL, 'PENDING_ASSIGNMENT', NULL, NULL, NULL, '2026-02-02 10:40:00', '2026-02-02 10:20:30');

-- ----------------------------------------------------------------------------
-- 20. DELIVERY STATUS HISTORY
-- ----------------------------------------------------------------------------
INSERT INTO delivery_status_history (history_id, delivery_id, status, updated_at, remarks) VALUES
(1, 1, 'PENDING_ASSIGNMENT', '2026-02-02 08:31:00', 'Order ready for dispatch allocation'),
(2, 1, 'ASSIGNED', '2026-02-02 08:35:00', 'Assigned to EV Rider Murugan'),
(3, 1, 'PICKED_UP', '2026-02-02 08:38:00', 'Picked up from T. Nagar dark store counter'),
(4, 1, 'DELIVERED', '2026-02-02 08:49:00', 'Customer OTP confirmed at doorstep'),

(5, 2, 'PENDING_ASSIGNMENT', '2026-02-02 09:16:00', 'Order queued for rider'),
(6, 2, 'ASSIGNED', '2026-02-02 09:18:00', 'Assigned to Rider Senthil Kumar'),
(7, 2, 'PICKED_UP', '2026-02-02 09:22:00', 'Out from Adyar Hub'),
(8, 2, 'DELIVERED', '2026-02-02 09:34:00', 'Delivered successfully to Gandhi Nagar'),

(9, 3, 'PENDING_ASSIGNMENT', '2026-02-02 10:01:00', 'Order in preparation'),
(10, 3, 'ASSIGNED', '2026-02-02 10:04:00', 'Assigned to Rider Rajesh Pandian'),
(11, 3, 'PICKED_UP', '2026-02-02 10:07:00', 'Order en route on Bypass Road'),

(12, 4, 'PENDING_ASSIGNMENT', '2026-02-02 10:11:00', 'Packing in progress'),
(13, 4, 'ASSIGNED', '2026-02-02 10:13:00', 'Assigned to Rider Dinesh V'),

(14, 5, 'PENDING_ASSIGNMENT', '2026-02-02 10:20:30', 'Auto broadcast to nearby available riders');

-- ----------------------------------------------------------------------------
-- 21. INTER-STORE STOCK TRANSFERS
-- ----------------------------------------------------------------------------
INSERT INTO stock_transfers (transfer_id, transfer_number, source_store_id, destination_store_id, transfer_status, created_at, completed_at, notes) VALUES
(1, 'TRF-2026-0001', 4, 1, 'COMPLETED', '2026-01-30 14:00:00', '2026-01-30 17:30:00', 'Stock rebalance: Tea and Dairy surplus transfer from Anna Nagar to T. Nagar'),
(2, 'TRF-2026-0002', 1, 2, 'IN_TRANSIT', '2026-02-02 09:00:00', NULL, 'Emergency paneer replenishment to Adyar Hub');

-- ----------------------------------------------------------------------------
-- 22. STOCK TRANSFER ITEMS
-- ----------------------------------------------------------------------------
INSERT INTO stock_transfer_items (transfer_item_id, transfer_id, variant_id, quantity) VALUES
(1, 1, 23, 20), -- 20 units Tata Tea 500g
(2, 1, 2, 30),  -- 30 units Amul Milk 1L
(3, 2, 4, 25);  -- 25 units Amul Malai Paneer 200g

SELECT 'Sample data populated successfully across all 23 tables!' AS Status;
