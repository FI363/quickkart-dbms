/**
 * QuickKart DBMS — Complete Relational Schema, Foreign Key Graph,
 * Domain Metadata, Indexes, Triggers, Procedures & Sample Data
 * for the Interactive Notebook Sketch View (23 Tables • 8 Domains • 3NF)
 */

export const SCHEMA_DOMAINS = [
    {
        id: 'A',
        code: 'DOMAIN A',
        name: 'Identity & Access Management',
        shortName: 'Identity & RBAC',
        color: '#0ca678',
        bgTint: 'rgba(12, 166, 120, 0.07)',
        borderTint: 'rgba(12, 166, 120, 0.28)',
        badgeBg: '#e6fcf5',
        badgeText: '#087f5b',
        description: 'Role-Based Access Control (RBAC), unified user credentials, and customer delivery coordinates.',
        tables: ['roles', 'users', 'addresses']
    },
    {
        id: 'B',
        code: 'DOMAIN B',
        name: 'Product Catalogue & SKUs',
        shortName: 'Product Catalogue',
        color: '#7950f2',
        bgTint: 'rgba(121, 80, 242, 0.07)',
        borderTint: 'rgba(121, 80, 242, 0.28)',
        badgeBg: '#f3f0ff',
        badgeText: '#5f3dc4',
        description: 'Self-referential category taxonomy, brand registry, master products, and priced SKU variants.',
        tables: ['categories', 'brands', 'products', 'product_variants']
    },
    {
        id: 'C',
        code: 'DOMAIN C',
        name: 'Dark Stores & Inventory',
        shortName: 'Dark Stores & Stock',
        color: '#e67700',
        bgTint: 'rgba(245, 159, 0, 0.08)',
        borderTint: 'rgba(245, 159, 0, 0.30)',
        badgeBg: '#fff9db',
        badgeText: '#d9480f',
        description: 'Geospatial micro-fulfillment hubs, available vs. reserved stock separation, and immutable ledger.',
        tables: ['dark_stores', 'store_inventory', 'inventory_transactions']
    },
    {
        id: 'D',
        code: 'DOMAIN D',
        name: 'Shopping Carts & Orders',
        shortName: 'Carts & Orders',
        color: '#1c7ed6',
        bgTint: 'rgba(28, 126, 214, 0.07)',
        borderTint: 'rgba(28, 126, 214, 0.28)',
        badgeBg: '#e7f5ff',
        badgeText: '#1864ab',
        description: 'Hub-tethered active carts, atomic order headers, historical price snapshots, and status timelines.',
        tables: ['carts', 'cart_items', 'orders', 'order_items', 'order_status_history']
    },
    {
        id: 'E',
        code: 'DOMAIN E',
        name: 'Stock Reservations',
        shortName: 'Stock Locks',
        color: '#d6336c',
        bgTint: 'rgba(214, 51, 108, 0.07)',
        borderTint: 'rgba(214, 51, 108, 0.28)',
        badgeBg: '#fff0f6',
        badgeText: '#a61e4d',
        description: '15-minute checkout SLA stock locks preventing concurrent overselling under high load.',
        tables: ['stock_reservations']
    },
    {
        id: 'F',
        code: 'DOMAIN F',
        name: 'Payments & Refunds',
        shortName: 'Payments & Refunds',
        color: '#0ca678',
        bgTint: 'rgba(16, 152, 104, 0.07)',
        borderTint: 'rgba(16, 152, 104, 0.28)',
        badgeBg: '#ebfbee',
        badgeText: '#2b8a3e',
        description: 'Gateway payment authorizations across UPI/Card/COD and automated cancellation refund reversals.',
        tables: ['payments', 'refunds']
    },
    {
        id: 'G',
        code: 'DOMAIN G',
        name: 'Delivery Fleet Management',
        shortName: 'Delivery Fleet',
        color: '#0b7285',
        bgTint: 'rgba(11, 114, 133, 0.07)',
        borderTint: 'rgba(11, 114, 133, 0.28)',
        badgeBg: '#e3fafc',
        badgeText: '#0b7285',
        description: 'Last-mile rider profiles, live GPS availability, 1:1 order dispatch tasks, and SLA tracking.',
        tables: ['delivery_partners', 'deliveries', 'delivery_status_history']
    },
    {
        id: 'H',
        code: 'DOMAIN H',
        name: 'Inter-Store Stock Transfers',
        shortName: 'Stock Transfers',
        color: '#c92a2a',
        bgTint: 'rgba(201, 42, 42, 0.06)',
        borderTint: 'rgba(201, 42, 42, 0.26)',
        badgeBg: '#ffe3e3',
        badgeText: '#c92a2a',
        description: 'Multi-hub inventory rebalancing manifests between source and destination dark stores.',
        tables: ['stock_transfers', 'stock_transfer_items']
    }
];

export const SCHEMA_TABLES = [
    // =========================================================================
    // DOMAIN A: IDENTITY & ACCESS MANAGEMENT
    // =========================================================================
    {
        id: 'roles',
        number: 1,
        name: 'roles',
        domain: 'A',
        tier: 0,
        rowCount: 4,
        comment: 'System privilege roles for Role-Based Access Control (RBAC)',
        indexes: ['PRIMARY KEY (role_id)', 'uq_roles_name UNIQUE (role_name)'],
        checks: ["chk_roles_name: role_name IN ('CUSTOMER', 'ADMIN', 'STORE_MANAGER', 'DELIVERY_PARTNER')"],
        triggers: [],
        procedures: [],
        views: [],
        columns: [
            { name: 'role_id', type: 'BIGINT UNSIGNED', nullable: false, isPK: true, autoInc: true, desc: 'Unique role identifier' },
            { name: 'role_name', type: 'VARCHAR(30)', nullable: false, isUnique: true, desc: 'CUSTOMER | ADMIN | STORE_MANAGER | DELIVERY_PARTNER' },
            { name: 'description', type: 'VARCHAR(255)', nullable: true, desc: 'Role permissions summary' },
            { name: 'created_at', type: 'DATETIME', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', desc: 'Creation timestamp' }
        ],
        sampleRows: [
            { role_id: 1, role_name: 'ADMIN', description: 'Super administrator with system-wide analytics & catalogue control' },
            { role_id: 2, role_name: 'STORE_MANAGER', description: 'Store level inventory control and local stock replenishment' },
            { role_id: 3, role_name: 'DELIVERY_PARTNER', description: 'Last-mile delivery rider assigned to active orders' },
            { role_id: 4, role_name: 'CUSTOMER', description: 'End-user placing grocery orders for 10-15 min delivery' }
        ]
    },
    {
        id: 'users',
        number: 2,
        name: 'users',
        domain: 'A',
        tier: 1,
        rowCount: 19,
        comment: 'Master user accounts covering customers, store managers, delivery fleet, and admins',
        indexes: ['PRIMARY KEY (user_id)', 'uq_users_email UNIQUE (email)', 'uq_users_phone UNIQUE (phone)', 'idx_users_role (role_id)', 'idx_users_status (account_status)'],
        checks: ["chk_users_status: account_status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')"],
        triggers: [],
        procedures: [],
        views: ['vw_customer_order_history', 'vw_delivery_performance'],
        columns: [
            { name: 'user_id', type: 'BIGINT UNSIGNED', nullable: false, isPK: true, autoInc: true, desc: 'Unique user identifier' },
            { name: 'role_id', type: 'BIGINT UNSIGNED', nullable: false, isFK: true, fkTarget: 'roles.role_id', desc: 'FK -> roles(role_id)' },
            { name: 'full_name', type: 'VARCHAR(100)', nullable: false, desc: 'User full legal name' },
            { name: 'email', type: 'VARCHAR(150)', nullable: false, isUnique: true, desc: 'Primary email contact' },
            { name: 'phone', type: 'VARCHAR(15)', nullable: false, isUnique: true, desc: 'Phone number with country code' },
            { name: 'password_hash', type: 'VARCHAR(255)', nullable: false, desc: 'Bcrypt hashed credentials' },
            { name: 'account_status', type: 'VARCHAR(20)', nullable: false, defaultVal: "'ACTIVE'", desc: 'ACTIVE | INACTIVE | SUSPENDED' },
            { name: 'created_at', type: 'DATETIME', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', desc: 'Account creation time' },
            { name: 'updated_at', type: 'DATETIME', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', desc: 'Last modification time' }
        ],
        sampleRows: [
            { user_id: 1, role_id: 1, full_name: 'Farhaan Admin', email: 'admin@quickkart.in', phone: '+919840111111', account_status: 'ACTIVE' },
            { user_id: 2, role_id: 2, full_name: 'Karthik Raman', email: 'karthik.tnagar@quickkart.in', phone: '+919840222221', account_status: 'ACTIVE' },
            { user_id: 6, role_id: 3, full_name: 'Murugan Selvam', email: 'murugan.del@quickkart.in', phone: '+919840333331', account_status: 'ACTIVE' },
            { user_id: 12, role_id: 4, full_name: 'Aravind Swaminathan', email: 'aravind@gmail.com', phone: '+919840444441', account_status: 'ACTIVE' }
        ]
    },
    {
        id: 'addresses',
        number: 3,
        name: 'addresses',
        domain: 'A',
        tier: 2,
        rowCount: 10,
        comment: 'Saved customer delivery locations with GPS coordinates for Haversine SLA checks',
        indexes: ['PRIMARY KEY (address_id)', 'idx_addresses_user_default (user_id, is_default)', 'idx_addresses_pincode (pincode)'],
        checks: ["chk_address_type: address_type IN ('HOME', 'WORK', 'OTHER')"],
        triggers: [],
        procedures: ['sp_place_order'],
         functions: ['fn_is_store_servicing_address', 'fn_haversine_distance'],
        views: [],
        columns: [
            { name: 'address_id', type: 'BIGINT UNSIGNED', nullable: false, isPK: true, autoInc: true, desc: 'Unique address identifier' },
            { name: 'user_id', type: 'BIGINT UNSIGNED', nullable: false, isFK: true, fkTarget: 'users.user_id', desc: 'FK -> users(user_id) ON DELETE CASCADE' },
            { name: 'address_line', type: 'VARCHAR(255)', nullable: false, desc: 'Door/Flat no, building, street' },
            { name: 'area', type: 'VARCHAR(100)', nullable: false, desc: 'Locality / neighborhood' },
            { name: 'city', type: 'VARCHAR(100)', nullable: false, defaultVal: "'Chennai'", desc: 'City name' },
            { name: 'state', type: 'VARCHAR(50)', nullable: false, defaultVal: "'Tamil Nadu'", desc: 'State' },
            { name: 'pincode', type: 'VARCHAR(10)', nullable: false, desc: 'Postal PIN code' },
            { name: 'latitude', type: 'DECIMAL(10,7)', nullable: true, desc: 'GPS latitude' },
            { name: 'longitude', type: 'DECIMAL(10,7)', nullable: true, desc: 'GPS longitude' },
            { name: 'address_type', type: 'VARCHAR(20)', nullable: false, defaultVal: "'HOME'", desc: 'HOME | WORK | OTHER' },
            { name: 'is_default', type: 'BOOLEAN', nullable: false, defaultVal: 'FALSE', desc: 'Default delivery address' },
            { name: 'created_at', type: 'DATETIME', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', desc: 'Record created timestamp' }
        ],
        sampleRows: [
            { address_id: 1, user_id: 12, address_line: 'Flat 3B, Ceebros Heights, 12 Pondy Bazaar', area: 'T. Nagar', pincode: '600017', address_type: 'HOME', is_default: true },
            { address_id: 3, user_id: 13, address_line: '24, 2nd Main Road, Gandhi Nagar', area: 'Adyar', pincode: '600020', address_type: 'HOME', is_default: true },
            { address_id: 4, user_id: 14, address_line: '56/2, 100 Feet Bypass Road', area: 'Velachery', pincode: '600042', address_type: 'HOME', is_default: true }
        ]
    },

    // =========================================================================
    // DOMAIN B: PRODUCT CATALOGUE
    // =========================================================================
    {
        id: 'categories',
        number: 4,
        name: 'categories',
        domain: 'B',
        tier: 0,
        rowCount: 15,
        comment: 'Hierarchical category tree with self-referential parent_category_id key',
        indexes: ['PRIMARY KEY (category_id)', 'uq_categories_slug UNIQUE (slug)', 'idx_categories_parent (parent_category_id)'],
        checks: [],
        triggers: [],
        procedures: [],
        views: ['vw_available_products'],
        columns: [
            { name: 'category_id', type: 'BIGINT UNSIGNED', nullable: false, isPK: true, autoInc: true, desc: 'Unique category identifier' },
            { name: 'parent_category_id', type: 'BIGINT UNSIGNED', nullable: true, isFK: true, fkTarget: 'categories.category_id', desc: 'Self-FK -> categories(category_id)' },
            { name: 'category_name', type: 'VARCHAR(100)', nullable: false, desc: 'Category display title' },
            { name: 'slug', type: 'VARCHAR(120)', nullable: false, isUnique: true, desc: 'URL-friendly slug' },
            { name: 'description', type: 'TEXT', nullable: true, desc: 'Category details' },
            { name: 'image_url', type: 'VARCHAR(500)', nullable: true, desc: 'Banner image URL' },
            { name: 'is_active', type: 'BOOLEAN', nullable: false, defaultVal: 'TRUE', desc: 'Active visibility status' },
            { name: 'created_at', type: 'DATETIME', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', desc: 'Creation time' }
        ],
        sampleRows: [
            { category_id: 1, parent_category_id: null, category_name: 'Dairy & Breakfast', slug: 'dairy-breakfast', is_active: true },
            { category_id: 6, parent_category_id: 1, category_name: 'Milk & Cream', slug: 'milk-cream', is_active: true },
            { category_id: 7, parent_category_id: 1, category_name: 'Curd & Paneer', slug: 'curd-paneer', is_active: true }
        ]
    },
    {
        id: 'brands',
        number: 5,
        name: 'brands',
        domain: 'B',
        tier: 0,
        rowCount: 12,
        comment: 'Product manufacturer brands (Amul, Aavin, Britannia, Tata, etc.)',
        indexes: ['PRIMARY KEY (brand_id)', 'uq_brands_name UNIQUE (brand_name)'],
        checks: [],
        triggers: [],
        procedures: [],
        views: ['vw_available_products', 'vw_low_stock'],
        columns: [
            { name: 'brand_id', type: 'BIGINT UNSIGNED', nullable: false, isPK: true, autoInc: true, desc: 'Unique brand identifier' },
            { name: 'brand_name', type: 'VARCHAR(100)', nullable: false, isUnique: true, desc: 'Brand name (e.g. Amul, Aavin)' },
            { name: 'description', type: 'TEXT', nullable: true, desc: 'Brand overview' },
            { name: 'logo_url', type: 'VARCHAR(500)', nullable: true, desc: 'Logo image link' },
            { name: 'created_at', type: 'DATETIME', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', desc: 'Creation timestamp' }
        ],
        sampleRows: [
            { brand_id: 1, brand_name: 'Amul', description: 'The Taste of India — dairy cooperatives' },
            { brand_id: 2, brand_name: 'Aavin', description: 'Tamil Nadu Co-operative Milk Producers Federation' },
            { brand_id: 4, brand_name: 'Britannia', description: 'Leading bakery and biscuit brand' }
        ]
    },
    {
        id: 'products',
        number: 6,
        name: 'products',
        domain: 'B',
        tier: 1,
        rowCount: 19,
        comment: 'Master catalogue entities independent of dark store and SKU weight',
        indexes: ['PRIMARY KEY (product_id)', 'idx_products_category (category_id)', 'idx_products_brand (brand_id)', 'idx_products_name (product_name)', 'idx_products_active (is_active)'],
        checks: [],
        triggers: [],
        procedures: ['sp_place_order'],
        views: ['vw_available_products', 'vw_low_stock'],
        columns: [
            { name: 'product_id', type: 'BIGINT UNSIGNED', nullable: false, isPK: true, autoInc: true, desc: 'Unique product identifier' },
            { name: 'category_id', type: 'BIGINT UNSIGNED', nullable: false, isFK: true, fkTarget: 'categories.category_id', desc: 'FK -> categories(category_id)' },
            { name: 'brand_id', type: 'BIGINT UNSIGNED', nullable: false, isFK: true, fkTarget: 'brands.brand_id', desc: 'FK -> brands(brand_id)' },
            { name: 'product_name', type: 'VARCHAR(150)', nullable: false, desc: 'Product display title' },
            { name: 'description', type: 'TEXT', nullable: true, desc: 'Detailed product information' },
            { name: 'image_url', type: 'VARCHAR(500)', nullable: true, desc: 'Primary product thumbnail' },
            { name: 'is_active', type: 'BOOLEAN', nullable: false, defaultVal: 'TRUE', desc: 'Catalogue visibility flag' },
            { name: 'created_at', type: 'DATETIME', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', desc: 'Registration timestamp' },
            { name: 'updated_at', type: 'DATETIME', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', desc: 'Last modification' }
        ],
        sampleRows: [
            { product_id: 1, category_id: 6, brand_id: 1, product_name: 'Amul Taaza Homogenised Toned Milk', is_active: true },
            { product_id: 3, category_id: 7, brand_id: 1, product_name: 'Amul Malai Paneer', is_active: true },
            { product_id: 18, category_id: 14, brand_id: 9, product_name: 'Tata Tea Premium Blend', is_active: true }
        ]
    },
    {
        id: 'product_variants',
        number: 7,
        name: 'product_variants',
        domain: 'B',
        tier: 2,
        rowCount: 24,
        comment: 'Specific Stock-Keeping Units (SKUs) with weight/volume units and INR pricing',
        indexes: ['PRIMARY KEY (variant_id)', 'uq_variants_sku UNIQUE (sku)', 'idx_variants_product (product_id)', 'idx_variants_price (price)', 'idx_variants_active (is_active)'],
        checks: ['chk_variant_price: price >= 0', 'chk_variant_mrp: mrp IS NULL OR mrp >= price'],
        triggers: [],
        procedures: ['sp_place_order', 'sp_add_inventory', 'sp_transfer_inventory'],
        functions: ['fn_get_available_stock', 'fn_calculate_cart_total'],
        views: ['vw_available_products', 'vw_low_stock'],
        columns: [
            { name: 'variant_id', type: 'BIGINT UNSIGNED', nullable: false, isPK: true, autoInc: true, desc: 'Unique variant identifier' },
            { name: 'product_id', type: 'BIGINT UNSIGNED', nullable: false, isFK: true, fkTarget: 'products.product_id', desc: 'FK -> products(product_id) ON DELETE CASCADE' },
            { name: 'sku', type: 'VARCHAR(50)', nullable: false, isUnique: true, desc: 'Machine SKU code (e.g. AML-MLK-500)' },
            { name: 'variant_name', type: 'VARCHAR(100)', nullable: false, desc: 'Variant title (e.g. 500 ml Pouch)' },
            { name: 'unit', type: 'VARCHAR(30)', nullable: false, desc: 'Unit measure (500 ml, 1 kg)' },
            { name: 'price', type: 'DECIMAL(10,2)', nullable: false, desc: 'Selling price (INR)' },
            { name: 'mrp', type: 'DECIMAL(10,2)', nullable: true, desc: 'Maximum Retail Price' },
            { name: 'is_active', type: 'BOOLEAN', nullable: false, defaultVal: 'TRUE', desc: 'Active SKU flag' },
            { name: 'created_at', type: 'DATETIME', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', desc: 'Creation timestamp' }
        ],
        sampleRows: [
            { variant_id: 1, product_id: 1, sku: 'AML-MLK-500', variant_name: 'Amul Taaza 500 ml Pouch', unit: '500 ml', price: 27.00, mrp: 28.00 },
            { variant_id: 4, product_id: 3, sku: 'AML-PAN-200', variant_name: 'Amul Malai Paneer 200g Block', unit: '200 g', price: 92.00, mrp: 95.00 },
            { variant_id: 23, product_id: 18, sku: 'TAT-TEA-500', variant_name: 'Tata Tea Premium Blend 500g Pack', unit: '500 g', price: 260.00, mrp: 280.00 }
        ]
    },

    // =========================================================================
    // DOMAIN C: DARK STORES & INVENTORY MANAGEMENT
    // =========================================================================
    {
        id: 'dark_stores',
        number: 8,
        name: 'dark_stores',
        domain: 'C',
        tier: 0,
        rowCount: 4,
        comment: 'Micro-fulfillment warehouses across Chennai serving specific geospatial radii',
        indexes: ['PRIMARY KEY (store_id)', 'idx_stores_area (area)', 'idx_stores_active (is_active)'],
        checks: ['chk_store_radius: service_radius_km > 0'],
        triggers: [],
        procedures: ['sp_place_order', 'sp_add_inventory', 'sp_transfer_inventory'],
        functions: ['fn_is_store_servicing_address', 'fn_haversine_distance'],
        views: ['vw_available_products', 'vw_low_stock', 'vw_daily_store_sales', 'vw_customer_order_history'],
        columns: [
            { name: 'store_id', type: 'BIGINT UNSIGNED', nullable: false, isPK: true, autoInc: true, desc: 'Unique store identifier' },
            { name: 'store_name', type: 'VARCHAR(100)', nullable: false, desc: 'Hub title (e.g. QuickKart T. Nagar Hub)' },
            { name: 'address', type: 'VARCHAR(255)', nullable: false, desc: 'Physical street address' },
            { name: 'area', type: 'VARCHAR(100)', nullable: false, desc: 'Neighborhood / locality' },
            { name: 'city', type: 'VARCHAR(100)', nullable: false, defaultVal: "'Chennai'", desc: 'City' },
            { name: 'pincode', type: 'VARCHAR(10)', nullable: false, desc: 'Hub PIN code' },
            { name: 'latitude', type: 'DECIMAL(10,7)', nullable: false, desc: 'Exact GPS latitude' },
            { name: 'longitude', type: 'DECIMAL(10,7)', nullable: false, desc: 'Exact GPS longitude' },
            { name: 'service_radius_km', type: 'DECIMAL(5,2)', nullable: false, defaultVal: '5.00', desc: 'Delivery SLA radius (km)' },
            { name: 'is_active', type: 'BOOLEAN', nullable: false, defaultVal: 'TRUE', desc: 'Operational status' },
            { name: 'created_at', type: 'DATETIME', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', desc: 'Opening timestamp' }
        ],
        sampleRows: [
            { store_id: 1, store_name: 'QuickKart T. Nagar Hub', area: 'T. Nagar', pincode: '600017', service_radius_km: 4.50, is_active: true },
            { store_id: 2, store_name: 'QuickKart Adyar Hub', area: 'Adyar', pincode: '600020', service_radius_km: 5.00, is_active: true },
            { store_id: 3, store_name: 'QuickKart Velachery Hub', area: 'Velachery', pincode: '600042', service_radius_km: 5.00, is_active: true },
            { store_id: 4, store_name: 'QuickKart Anna Nagar Hub', area: 'Anna Nagar', pincode: '600040', service_radius_km: 4.00, is_active: true }
        ]
    },
    {
        id: 'store_inventory',
        number: 9,
        name: 'store_inventory',
        domain: 'C',
        tier: 3,
        rowCount: 45,
        comment: 'Live inventory levels per store with strict available vs. reserved separation',
        indexes: ['PRIMARY KEY (inventory_id)', 'uq_store_variant UNIQUE (store_id, variant_id)', 'idx_inventory_lookup (store_id, variant_id, total_quantity, reserved_quantity)', 'idx_inventory_reorder_scan (store_id, total_quantity, reorder_level)'],
        checks: ['chk_inventory_qty_non_negative: total_quantity >= 0', 'chk_inventory_reserved_non_negative: reserved_quantity >= 0', 'chk_inventory_reserved_le_total: reserved_quantity <= total_quantity'],
        triggers: [],
        procedures: ['sp_place_order', 'sp_cancel_order', 'sp_add_inventory', 'sp_transfer_inventory'],
        functions: ['fn_get_available_stock'],
        views: ['vw_available_products', 'vw_low_stock'],
        columns: [
            { name: 'inventory_id', type: 'BIGINT UNSIGNED', nullable: false, isPK: true, autoInc: true, desc: 'Unique inventory row ID' },
            { name: 'store_id', type: 'BIGINT UNSIGNED', nullable: false, isFK: true, fkTarget: 'dark_stores.store_id', desc: 'FK -> dark_stores(store_id)' },
            { name: 'variant_id', type: 'BIGINT UNSIGNED', nullable: false, isFK: true, fkTarget: 'product_variants.variant_id', desc: 'FK -> product_variants(variant_id)' },
            { name: 'total_quantity', type: 'INT', nullable: false, defaultVal: '0', desc: 'Physical stock on shelves' },
            { name: 'reserved_quantity', type: 'INT', nullable: false, defaultVal: '0', desc: 'Temporarily locked in checkout' },
            { name: 'reorder_level', type: 'INT', nullable: false, defaultVal: '10', desc: 'Threshold for restocking alert' },
            { name: 'updated_at', type: 'DATETIME', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', desc: 'Last stock count change' }
        ],
        sampleRows: [
            { inventory_id: 1, store_id: 1, variant_id: 1, total_quantity: 120, reserved_quantity: 2, reorder_level: 20 },
            { inventory_id: 15, store_id: 1, variant_id: 23, total_quantity: 8, reserved_quantity: 0, reorder_level: 10 },
            { inventory_id: 18, store_id: 2, variant_id: 4, total_quantity: 5, reserved_quantity: 0, reorder_level: 10 }
        ]
    },
    {
        id: 'inventory_transactions',
        number: 10,
        name: 'inventory_transactions',
        domain: 'C',
        tier: 4,
        rowCount: 5,
        comment: 'Complete immutable audit trail for every inventory balance modification',
        indexes: ['PRIMARY KEY (transaction_id)', 'idx_inv_tx_inventory_created (inventory_id, created_at)', 'idx_inv_tx_reference (reference_id, transaction_type)'],
        checks: ["chk_inv_tx_type: transaction_type IN ('RESTOCK','ORDER_RESERVED','ORDER_FULFILLED','ORDER_CANCELLED','TRANSFER_IN','TRANSFER_OUT','DAMAGE_ADJUSTMENT','AUDIT_CORRECTION')"],
        triggers: [],
        procedures: ['sp_cancel_order', 'sp_add_inventory', 'sp_transfer_inventory'],
        views: [],
        columns: [
            { name: 'transaction_id', type: 'BIGINT UNSIGNED', nullable: false, isPK: true, autoInc: true, desc: 'Audit record ID' },
            { name: 'inventory_id', type: 'BIGINT UNSIGNED', nullable: false, isFK: true, fkTarget: 'store_inventory.inventory_id', desc: 'FK -> store_inventory(inventory_id)' },
            { name: 'transaction_type', type: 'VARCHAR(30)', nullable: false, desc: 'RESTOCK | TRANSFER_IN | TRANSFER_OUT | ...' },
            { name: 'quantity_change', type: 'INT', nullable: false, desc: 'Signed delta (+ or -)' },
            { name: 'previous_quantity', type: 'INT', nullable: false, desc: 'Stock balance before change' },
            { name: 'new_quantity', type: 'INT', nullable: false, desc: 'Stock balance after change' },
            { name: 'reference_id', type: 'BIGINT UNSIGNED', nullable: true, desc: 'Linked order_id or transfer_id' },
            { name: 'notes', type: 'TEXT', nullable: true, desc: 'Audit reason / memo' },
            { name: 'created_at', type: 'DATETIME', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', desc: 'Log timestamp' }
        ],
        sampleRows: [
            { transaction_id: 1, inventory_id: 1, transaction_type: 'RESTOCK', quantity_change: 120, previous_quantity: 0, new_quantity: 120, notes: 'Initial store opening inward replenishment' },
            { transaction_id: 5, inventory_id: 15, transaction_type: 'DAMAGE_ADJUSTMENT', quantity_change: -7, previous_quantity: 15, new_quantity: 8, notes: 'Water damaged packets discarded' }
        ]
    },

    // =========================================================================
    // DOMAIN D: SHOPPING CARTS & ORDER MANAGEMENT
    // =========================================================================
    {
        id: 'carts',
        number: 11,
        name: 'carts',
        domain: 'D',
        tier: 2,
        rowCount: 2,
        comment: 'Customer shopping carts tethered to a specific dark store',
        indexes: ['PRIMARY KEY (cart_id)', 'idx_carts_user_status (user_id, cart_status)'],
        checks: ["chk_cart_status: cart_status IN ('ACTIVE', 'ABANDONED', 'CONVERTED')"],
        triggers: [],
        procedures: ['sp_place_order'],
        functions: ['fn_calculate_cart_total'],
        views: [],
        columns: [
            { name: 'cart_id', type: 'BIGINT UNSIGNED', nullable: false, isPK: true, autoInc: true, desc: 'Cart session ID' },
            { name: 'user_id', type: 'BIGINT UNSIGNED', nullable: false, isFK: true, fkTarget: 'users.user_id', desc: 'FK -> users(user_id) ON DELETE CASCADE' },
            { name: 'store_id', type: 'BIGINT UNSIGNED', nullable: false, isFK: true, fkTarget: 'dark_stores.store_id', desc: 'FK -> dark_stores(store_id)' },
            { name: 'cart_status', type: 'VARCHAR(20)', nullable: false, defaultVal: "'ACTIVE'", desc: 'ACTIVE | ABANDONED | CONVERTED' },
            { name: 'created_at', type: 'DATETIME', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', desc: 'Cart creation time' },
            { name: 'updated_at', type: 'DATETIME', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', desc: 'Last item update' }
        ],
        sampleRows: [
            { cart_id: 1, user_id: 16, store_id: 1, cart_status: 'ACTIVE' },
            { cart_id: 2, user_id: 17, store_id: 2, cart_status: 'ACTIVE' }
        ]
    },
    {
        id: 'cart_items',
        number: 12,
        name: 'cart_items',
        domain: 'D',
        tier: 3,
        rowCount: 4,
        comment: 'Line items inside active customer carts',
        indexes: ['PRIMARY KEY (cart_item_id)', 'uq_cart_variant UNIQUE (cart_id, variant_id)', 'idx_cart_items_cart (cart_id)', 'idx_cart_items_variant (variant_id)'],
        checks: ['chk_cart_item_qty: quantity > 0'],
        triggers: ['trg_validate_cart_item_insert', 'trg_validate_cart_item_update'],
        procedures: ['sp_place_order'],
        functions: ['fn_calculate_cart_total'],
        views: [],
        columns: [
            { name: 'cart_item_id', type: 'BIGINT UNSIGNED', nullable: false, isPK: true, autoInc: true, desc: 'Item row identifier' },
            { name: 'cart_id', type: 'BIGINT UNSIGNED', nullable: false, isFK: true, fkTarget: 'carts.cart_id', desc: 'FK -> carts(cart_id) ON DELETE CASCADE' },
            { name: 'variant_id', type: 'BIGINT UNSIGNED', nullable: false, isFK: true, fkTarget: 'product_variants.variant_id', desc: 'FK -> product_variants(variant_id)' },
            { name: 'quantity', type: 'INT', nullable: false, defaultVal: '1', desc: 'Selected units (> 0)' },
            { name: 'created_at', type: 'DATETIME', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', desc: 'Added timestamp' },
            { name: 'updated_at', type: 'DATETIME', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', desc: 'Quantity changed time' }
        ],
        sampleRows: [
            { cart_item_id: 1, cart_id: 1, variant_id: 1, quantity: 2 },
            { cart_item_id: 2, cart_id: 1, variant_id: 7, quantity: 1 },
            { cart_item_id: 3, cart_id: 2, variant_id: 4, quantity: 1 }
        ]
    },
    {
        id: 'orders',
        number: 13,
        name: 'orders',
        domain: 'D',
        tier: 3,
        rowCount: 6,
        comment: 'Master order transactions with immutable delivery address snapshot',
        indexes: ['PRIMARY KEY (order_id)', 'uq_orders_number UNIQUE (order_number)', 'idx_orders_user_created (user_id, created_at DESC)', 'idx_orders_store_status (store_id, order_status)', 'idx_orders_status_created (order_status, created_at DESC)'],
        checks: ['chk_orders_subtotal: subtotal >= 0', "chk_orders_status: order_status IN ('PENDING','CONFIRMED','PACKING','OUT_FOR_DELIVERY','DELIVERED','CANCELLED')"],
        triggers: ['trg_order_status_history'],
        procedures: ['sp_place_order', 'sp_cancel_order', 'sp_assign_delivery'],
        views: ['vw_daily_store_sales', 'vw_customer_order_history'],
        columns: [
            { name: 'order_id', type: 'BIGINT UNSIGNED', nullable: false, isPK: true, autoInc: true, desc: 'Unique order ID' },
            { name: 'user_id', type: 'BIGINT UNSIGNED', nullable: false, isFK: true, fkTarget: 'users.user_id', desc: 'FK -> users(user_id)' },
            { name: 'store_id', type: 'BIGINT UNSIGNED', nullable: false, isFK: true, fkTarget: 'dark_stores.store_id', desc: 'FK -> dark_stores(store_id)' },
            { name: 'address_id', type: 'BIGINT UNSIGNED', nullable: false, isFK: true, fkTarget: 'addresses.address_id', desc: 'FK -> addresses(address_id)' },
            { name: 'order_number', type: 'VARCHAR(40)', nullable: false, isUnique: true, desc: 'Human-readable order code' },
            { name: 'delivery_address_snapshot', type: 'TEXT', nullable: false, desc: 'Immutable address string at order time' },
            { name: 'subtotal', type: 'DECIMAL(10,2)', nullable: false, desc: 'Items total' },
            { name: 'delivery_fee', type: 'DECIMAL(10,2)', nullable: false, defaultVal: '0.00', desc: 'Express delivery charge' },
            { name: 'discount', type: 'DECIMAL(10,2)', nullable: false, defaultVal: '0.00', desc: 'Coupon / promo discount' },
            { name: 'total_amount', type: 'DECIMAL(10,2)', nullable: false, desc: 'Net payable amount' },
            { name: 'order_status', type: 'VARCHAR(30)', nullable: false, defaultVal: "'PENDING'", desc: 'Fulfillment lifecycle state' },
            { name: 'created_at', type: 'DATETIME', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', desc: 'Checkout timestamp' },
            { name: 'updated_at', type: 'DATETIME', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', desc: 'Last status update' }
        ],
        sampleRows: [
            { order_id: 1, order_number: 'ORD-2026-0001', user_id: 12, store_id: 1, total_amount: 158.00, order_status: 'DELIVERED' },
            { order_id: 3, order_number: 'ORD-2026-0003', user_id: 14, store_id: 3, total_amount: 139.00, order_status: 'OUT_FOR_DELIVERY' },
            { order_id: 4, order_number: 'ORD-2026-0004', user_id: 15, store_id: 4, total_amount: 250.00, order_status: 'PACKING' }
        ]
    },
    {
        id: 'order_items',
        number: 14,
        name: 'order_items',
        domain: 'D',
        tier: 4,
        rowCount: 17,
        comment: 'Immutable historical line items with product name and unit price snapshots',
        indexes: ['PRIMARY KEY (order_item_id)', 'idx_order_items_order (order_id)', 'idx_order_items_variant (variant_id)'],
        checks: ['chk_order_item_qty: quantity > 0', 'chk_order_item_price: unit_price >= 0', 'chk_order_item_subtotal: subtotal >= 0'],
        triggers: ['trg_validate_order_item'],
        procedures: ['sp_place_order'],
        views: ['vw_customer_order_history'],
        columns: [
            { name: 'order_item_id', type: 'BIGINT UNSIGNED', nullable: false, isPK: true, autoInc: true, desc: 'Order line item ID' },
            { name: 'order_id', type: 'BIGINT UNSIGNED', nullable: false, isFK: true, fkTarget: 'orders.order_id', desc: 'FK -> orders(order_id) ON DELETE CASCADE' },
            { name: 'variant_id', type: 'BIGINT UNSIGNED', nullable: false, isFK: true, fkTarget: 'product_variants.variant_id', desc: 'FK -> product_variants(variant_id)' },
            { name: 'product_name_snapshot', type: 'VARCHAR(150)', nullable: false, desc: 'Product title at purchase' },
            { name: 'variant_name_snapshot', type: 'VARCHAR(100)', nullable: false, desc: 'Variant title at purchase' },
            { name: 'quantity', type: 'INT', nullable: false, desc: 'Units purchased' },
            { name: 'unit_price', type: 'DECIMAL(10,2)', nullable: false, desc: 'Historical unit price' },
            { name: 'subtotal', type: 'DECIMAL(10,2)', nullable: false, desc: 'Line total (qty * unit_price)' }
        ],
        sampleRows: [
            { order_item_id: 1, order_id: 1, variant_id: 1, product_name_snapshot: 'Amul Taaza Homogenised Toned Milk', quantity: 2, unit_price: 27.00, subtotal: 54.00 },
            { order_item_id: 2, order_id: 1, variant_id: 7, product_name_snapshot: 'Britannia Whole Wheat Bread', quantity: 1, unit_price: 45.00, subtotal: 45.00 }
        ]
    },
    {
        id: 'order_status_history',
        number: 15,
        name: 'order_status_history',
        domain: 'D',
        tier: 4,
        rowCount: 22,
        comment: 'Chronological audit trail of order fulfillment state transitions',
        indexes: ['PRIMARY KEY (history_id)', 'idx_order_history_order (order_id, changed_at ASC)'],
        checks: [],
        triggers: ['trg_order_status_history (AFTER UPDATE ON orders)'],
        procedures: ['sp_place_order', 'sp_cancel_order'],
        views: [],
        columns: [
            { name: 'history_id', type: 'BIGINT UNSIGNED', nullable: false, isPK: true, autoInc: true, desc: 'History transition ID' },
            { name: 'order_id', type: 'BIGINT UNSIGNED', nullable: false, isFK: true, fkTarget: 'orders.order_id', desc: 'FK -> orders(order_id) ON DELETE CASCADE' },
            { name: 'previous_status', type: 'VARCHAR(30)', nullable: true, desc: 'Prior order status' },
            { name: 'new_status', type: 'VARCHAR(30)', nullable: false, desc: 'New status entered' },
            { name: 'changed_at', type: 'DATETIME', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', desc: 'Transition timestamp' },
            { name: 'remarks', type: 'TEXT', nullable: true, desc: 'Transition notes / reason' }
        ],
        sampleRows: [
            { history_id: 1, order_id: 1, previous_status: null, new_status: 'PENDING', remarks: 'Order placed by customer via UPI' },
            { history_id: 5, order_id: 1, previous_status: 'OUT_FOR_DELIVERY', new_status: 'DELIVERED', remarks: 'Delivered in 19 mins to customer doorstep' }
        ]
    },

    // =========================================================================
    // DOMAIN E: STOCK RESERVATIONS
    // =========================================================================
    {
        id: 'stock_reservations',
        number: 16,
        name: 'stock_reservations',
        domain: 'E',
        tier: 4,
        rowCount: 6,
        comment: 'Temporary stock locks during checkout window to prevent concurrent overselling',
        indexes: ['PRIMARY KEY (reservation_id)', 'idx_res_status_expires (reservation_status, expires_at)', 'idx_res_store_variant (store_id, variant_id)', 'idx_res_order (order_id)'],
        checks: ['chk_res_qty: quantity > 0', "chk_res_status: reservation_status IN ('ACTIVE', 'CONFIRMED', 'RELEASED', 'EXPIRED')"],
        triggers: [],
        procedures: ['sp_place_order', 'sp_cancel_order', 'sp_release_expired_reservations'],
        views: [],
        columns: [
            { name: 'reservation_id', type: 'BIGINT UNSIGNED', nullable: false, isPK: true, autoInc: true, desc: 'Reservation identifier' },
            { name: 'order_id', type: 'BIGINT UNSIGNED', nullable: false, isFK: true, fkTarget: 'orders.order_id', desc: 'FK -> orders(order_id) ON DELETE CASCADE' },
            { name: 'variant_id', type: 'BIGINT UNSIGNED', nullable: false, isFK: true, fkTarget: 'product_variants.variant_id', desc: 'FK -> product_variants(variant_id)' },
            { name: 'store_id', type: 'BIGINT UNSIGNED', nullable: false, isFK: true, fkTarget: 'dark_stores.store_id', desc: 'FK -> dark_stores(store_id)' },
            { name: 'quantity', type: 'INT', nullable: false, desc: 'Quantity locked (> 0)' },
            { name: 'reservation_status', type: 'VARCHAR(20)', nullable: false, defaultVal: "'ACTIVE'", desc: 'ACTIVE | CONFIRMED | RELEASED | EXPIRED' },
            { name: 'expires_at', type: 'DATETIME', nullable: false, desc: '15-minute SLA expiration timestamp' },
            { name: 'created_at', type: 'DATETIME', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', desc: 'Time reservation made' }
        ],
        sampleRows: [
            { reservation_id: 1, order_id: 1, variant_id: 1, store_id: 1, quantity: 2, reservation_status: 'CONFIRMED' },
            { reservation_id: 3, order_id: 4, variant_id: 23, store_id: 4, quantity: 1, reservation_status: 'ACTIVE' },
            { reservation_id: 6, order_id: 6, variant_id: 4, store_id: 1, quantity: 2, reservation_status: 'RELEASED' }
        ]
    },

    // =========================================================================
    // DOMAIN F: PAYMENTS & REFUNDS
    // =========================================================================
    {
        id: 'payments',
        number: 17,
        name: 'payments',
        domain: 'F',
        tier: 4,
        rowCount: 6,
        comment: 'Simulated and recorded financial transactions for customer orders',
        indexes: ['PRIMARY KEY (payment_id)', 'uq_payments_ref UNIQUE (transaction_reference)', 'idx_payments_order (order_id)', 'idx_payments_status (payment_status)', 'idx_payments_created (created_at DESC)'],
        checks: ['chk_payments_amount: amount > 0', "chk_payments_method: payment_method IN ('UPI','CREDIT_CARD','DEBIT_CARD','NET_BANKING','WALLET','COD')", "chk_payments_status: payment_status IN ('PENDING','SUCCESS','FAILED','REFUNDED')"],
        triggers: [],
        procedures: ['sp_place_order', 'sp_cancel_order'],
        views: ['vw_customer_order_history'],
        columns: [
            { name: 'payment_id', type: 'BIGINT UNSIGNED', nullable: false, isPK: true, autoInc: true, desc: 'Payment record ID' },
            { name: 'order_id', type: 'BIGINT UNSIGNED', nullable: false, isFK: true, fkTarget: 'orders.order_id', desc: 'FK -> orders(order_id)' },
            { name: 'transaction_reference', type: 'VARCHAR(100)', nullable: false, isUnique: true, desc: 'Payment gateway txn ID' },
            { name: 'payment_method', type: 'VARCHAR(30)', nullable: false, desc: 'UPI | CREDIT_CARD | COD | ...' },
            { name: 'amount', type: 'DECIMAL(10,2)', nullable: false, desc: 'Amount charged (INR)' },
            { name: 'payment_status', type: 'VARCHAR(20)', nullable: false, defaultVal: "'PENDING'", desc: 'PENDING | SUCCESS | FAILED | REFUNDED' },
            { name: 'paid_at', type: 'DATETIME', nullable: true, desc: 'Payment settlement timestamp' },
            { name: 'created_at', type: 'DATETIME', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', desc: 'Creation time' }
        ],
        sampleRows: [
            { payment_id: 1, order_id: 1, transaction_reference: 'TXN-UPI-20260202-849201', payment_method: 'UPI', amount: 158.00, payment_status: 'SUCCESS' },
            { payment_id: 6, order_id: 6, transaction_reference: 'TXN-UPI-20260201-772910', payment_method: 'UPI', amount: 199.00, payment_status: 'REFUNDED' }
        ]
    },
    {
        id: 'refunds',
        number: 18,
        name: 'refunds',
        domain: 'F',
        tier: 5,
        rowCount: 1,
        comment: 'Reversal transactions corresponding to cancelled or returned orders',
        indexes: ['PRIMARY KEY (refund_id)', 'uq_refunds_ref UNIQUE (refund_reference)', 'idx_refunds_payment (payment_id)', 'idx_refunds_status (refund_status)'],
        checks: ['chk_refund_amount: refund_amount > 0', "chk_refund_status: refund_status IN ('INITIATED', 'PROCESSED', 'FAILED')"],
        triggers: [],
        procedures: ['sp_cancel_order'],
        views: [],
        columns: [
            { name: 'refund_id', type: 'BIGINT UNSIGNED', nullable: false, isPK: true, autoInc: true, desc: 'Refund record ID' },
            { name: 'payment_id', type: 'BIGINT UNSIGNED', nullable: false, isFK: true, fkTarget: 'payments.payment_id', desc: 'FK -> payments(payment_id)' },
            { name: 'refund_reference', type: 'VARCHAR(100)', nullable: false, isUnique: true, desc: 'Gateway refund reference' },
            { name: 'refund_amount', type: 'DECIMAL(10,2)', nullable: false, desc: 'Refund amount (INR)' },
            { name: 'refund_reason', type: 'TEXT', nullable: true, desc: 'Reason for refund' },
            { name: 'refund_status', type: 'VARCHAR(20)', nullable: false, defaultVal: "'INITIATED'", desc: 'INITIATED | PROCESSED | FAILED' },
            { name: 'created_at', type: 'DATETIME', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', desc: 'Initiation time' },
            { name: 'processed_at', type: 'DATETIME', nullable: true, desc: 'Completion time' }
        ],
        sampleRows: [
            { refund_id: 1, payment_id: 6, refund_reference: 'RFND-20260201-998811', refund_amount: 199.00, refund_status: 'PROCESSED', refund_reason: 'Customer cancelled order prior to dispatch' }
        ]
    },

    // =========================================================================
    // DOMAIN G: DELIVERY MANAGEMENT
    // =========================================================================
    {
        id: 'delivery_partners',
        number: 19,
        name: 'delivery_partners',
        domain: 'G',
        tier: 2,
        rowCount: 6,
        comment: 'Delivery fleet personnel, EV/bike vehicle details, GPS, and operational status',
        indexes: ['PRIMARY KEY (partner_id)', 'uq_delivery_partner_user UNIQUE (user_id)', 'idx_partner_status (availability_status)', 'idx_partner_rating (rating DESC)'],
        checks: ["chk_partner_vehicle: vehicle_type IN ('BIKE','SCOOTER','EV_SCOOTER','CYCLE')", "chk_partner_status: availability_status IN ('AVAILABLE','BUSY','OFFLINE')", 'chk_partner_rating: rating BETWEEN 1.00 AND 5.00'],
        triggers: ['trg_release_rider_on_delivered'],
        procedures: ['sp_assign_delivery'],
        views: ['vw_customer_order_history', 'vw_delivery_performance'],
        columns: [
            { name: 'partner_id', type: 'BIGINT UNSIGNED', nullable: false, isPK: true, autoInc: true, desc: 'Partner record ID' },
            { name: 'user_id', type: 'BIGINT UNSIGNED', nullable: false, isFK: true, isUnique: true, fkTarget: 'users.user_id', desc: '1:1 FK -> users(user_id) ON DELETE CASCADE' },
            { name: 'vehicle_type', type: 'VARCHAR(30)', nullable: false, desc: 'BIKE | SCOOTER | EV_SCOOTER | CYCLE' },
            { name: 'vehicle_number', type: 'VARCHAR(30)', nullable: true, desc: 'Registration plate' },
            { name: 'current_latitude', type: 'DECIMAL(10,7)', nullable: true, desc: 'Current GPS latitude' },
            { name: 'current_longitude', type: 'DECIMAL(10,7)', nullable: true, desc: 'Current GPS longitude' },
            { name: 'availability_status', type: 'VARCHAR(20)', nullable: false, defaultVal: "'OFFLINE'", desc: 'AVAILABLE | BUSY | OFFLINE' },
            { name: 'rating', type: 'DECIMAL(3,2)', nullable: false, defaultVal: '5.00', desc: 'Customer rating (1.00 - 5.00)' },
            { name: 'created_at', type: 'DATETIME', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', desc: 'Enrolled timestamp' }
        ],
        sampleRows: [
            { partner_id: 1, user_id: 6, vehicle_type: 'EV_SCOOTER', vehicle_number: 'TN 09 BX 1234', availability_status: 'AVAILABLE', rating: 4.90 },
            { partner_id: 2, user_id: 7, vehicle_type: 'BIKE', vehicle_number: 'TN 07 CA 5678', availability_status: 'AVAILABLE', rating: 4.85 },
            { partner_id: 3, user_id: 8, vehicle_type: 'EV_SCOOTER', vehicle_number: 'TN 10 DF 9012', availability_status: 'BUSY', rating: 4.95 }
        ]
    },
    {
        id: 'deliveries',
        number: 20,
        name: 'deliveries',
        domain: 'G',
        tier: 4,
        rowCount: 5,
        comment: 'Last-mile delivery assignment and lifecycle dispatch tracking',
        indexes: ['PRIMARY KEY (delivery_id)', 'uq_deliveries_order UNIQUE (order_id)', 'idx_deliveries_partner_status (partner_id, delivery_status)', 'idx_deliveries_status (delivery_status)'],
        checks: ["chk_delivery_status: delivery_status IN ('PENDING_ASSIGNMENT','ASSIGNED','PICKED_UP','DELIVERED','FAILED')"],
        triggers: ['trg_delivery_status_history', 'trg_release_rider_on_delivered'],
        procedures: ['sp_place_order', 'sp_cancel_order', 'sp_assign_delivery'],
        views: ['vw_customer_order_history', 'vw_delivery_performance'],
        columns: [
            { name: 'delivery_id', type: 'BIGINT UNSIGNED', nullable: false, isPK: true, autoInc: true, desc: 'Delivery task ID' },
            { name: 'order_id', type: 'BIGINT UNSIGNED', nullable: false, isFK: true, isUnique: true, fkTarget: 'orders.order_id', desc: '1:1 FK -> orders(order_id)' },
            { name: 'partner_id', type: 'BIGINT UNSIGNED', nullable: true, isFK: true, fkTarget: 'delivery_partners.partner_id', desc: 'FK -> delivery_partners(partner_id)' },
            { name: 'delivery_status', type: 'VARCHAR(30)', nullable: false, defaultVal: "'PENDING_ASSIGNMENT'", desc: 'Dispatch status' },
            { name: 'assigned_at', type: 'DATETIME', nullable: true, desc: 'Rider assigned timestamp' },
            { name: 'picked_up_at', type: 'DATETIME', nullable: true, desc: 'Package collected timestamp' },
            { name: 'delivered_at', type: 'DATETIME', nullable: true, desc: 'Doorstep delivery timestamp' },
            { name: 'estimated_delivery_time', type: 'DATETIME', nullable: true, desc: 'SLA promised time' },
            { name: 'created_at', type: 'DATETIME', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', desc: 'Created time' },
            { name: 'updated_at', type: 'DATETIME', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', desc: 'Last modification' }
        ],
        sampleRows: [
            { delivery_id: 1, order_id: 1, partner_id: 1, delivery_status: 'DELIVERED', picked_up_at: '2026-02-02 08:38:00', delivered_at: '2026-02-02 08:49:00' },
            { delivery_id: 3, order_id: 3, partner_id: 3, delivery_status: 'PICKED_UP', picked_up_at: '2026-02-02 10:07:00', delivered_at: null }
        ]
    },
    {
        id: 'delivery_status_history',
        number: 21,
        name: 'delivery_status_history',
        domain: 'G',
        tier: 5,
        rowCount: 14,
        comment: 'Audit trail of delivery dispatch status transitions for SLA monitoring',
        indexes: ['PRIMARY KEY (history_id)', 'idx_del_history_delivery (delivery_id, updated_at ASC)'],
        checks: [],
        triggers: ['trg_delivery_status_history (AFTER UPDATE ON deliveries)'],
        procedures: ['sp_assign_delivery'],
        views: [],
        columns: [
            { name: 'history_id', type: 'BIGINT UNSIGNED', nullable: false, isPK: true, autoInc: true, desc: 'History log ID' },
            { name: 'delivery_id', type: 'BIGINT UNSIGNED', nullable: false, isFK: true, fkTarget: 'deliveries.delivery_id', desc: 'FK -> deliveries(delivery_id) ON DELETE CASCADE' },
            { name: 'status', type: 'VARCHAR(30)', nullable: false, desc: 'Status entered' },
            { name: 'updated_at', type: 'DATETIME', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', desc: 'Transition time' },
            { name: 'remarks', type: 'TEXT', nullable: true, desc: 'Rider / hub notes' }
        ],
        sampleRows: [
            { history_id: 1, delivery_id: 1, status: 'PENDING_ASSIGNMENT', remarks: 'Order ready for dispatch allocation' },
            { history_id: 4, delivery_id: 1, status: 'DELIVERED', remarks: 'Customer OTP confirmed at doorstep' }
        ]
    },

    // =========================================================================
    // DOMAIN H: INTER-STORE STOCK TRANSFERS
    // =========================================================================
    {
        id: 'stock_transfers',
        number: 22,
        name: 'stock_transfers',
        domain: 'H',
        tier: 1,
        rowCount: 2,
        comment: 'Inter-dark-store inventory rebalancing manifests between distinct hubs',
        indexes: ['PRIMARY KEY (transfer_id)', 'uq_transfers_number UNIQUE (transfer_number)', 'idx_transfers_source (source_store_id, transfer_status)', 'idx_transfers_dest (destination_store_id, transfer_status)', 'idx_transfers_status (transfer_status, created_at DESC)'],
        checks: ['chk_transfer_diff_stores: source_store_id <> destination_store_id', "chk_transfer_status: transfer_status IN ('PENDING','IN_TRANSIT','COMPLETED','CANCELLED')"],
        triggers: [],
        procedures: ['sp_transfer_inventory'],
        views: [],
        columns: [
            { name: 'transfer_id', type: 'BIGINT UNSIGNED', nullable: false, isPK: true, autoInc: true, desc: 'Transfer manifest ID' },
            { name: 'transfer_number', type: 'VARCHAR(40)', nullable: false, isUnique: true, desc: 'Human code (e.g. TRF-2026-0001)' },
            { name: 'source_store_id', type: 'BIGINT UNSIGNED', nullable: false, isFK: true, fkTarget: 'dark_stores.store_id', desc: 'FK -> dark_stores(store_id) [Source]' },
            { name: 'destination_store_id', type: 'BIGINT UNSIGNED', nullable: false, isFK: true, fkTarget: 'dark_stores.store_id', desc: 'FK -> dark_stores(store_id) [Dest]' },
            { name: 'transfer_status', type: 'VARCHAR(20)', nullable: false, defaultVal: "'PENDING'", desc: 'PENDING | IN_TRANSIT | COMPLETED | CANCELLED' },
            { name: 'created_at', type: 'DATETIME', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', desc: 'Created time' },
            { name: 'completed_at', type: 'DATETIME', nullable: true, desc: 'Received time' },
            { name: 'notes', type: 'TEXT', nullable: true, desc: 'Justification memo' }
        ],
        sampleRows: [
            { transfer_id: 1, transfer_number: 'TRF-2026-0001', source_store_id: 4, destination_store_id: 1, transfer_status: 'COMPLETED', notes: 'Tea & Dairy surplus transfer from Anna Nagar to T. Nagar' },
            { transfer_id: 2, transfer_number: 'TRF-2026-0002', source_store_id: 1, destination_store_id: 2, transfer_status: 'IN_TRANSIT', notes: 'Emergency paneer replenishment to Adyar Hub' }
        ]
    },
    {
        id: 'stock_transfer_items',
        number: 23,
        name: 'stock_transfer_items',
        domain: 'H',
        tier: 3,
        rowCount: 3,
        comment: 'Line items and SKU quantities transferred between dark stores',
        indexes: ['PRIMARY KEY (transfer_item_id)', 'uq_transfer_variant UNIQUE (transfer_id, variant_id)', 'idx_transfer_items_transfer (transfer_id)'],
        checks: ['chk_transfer_item_qty: quantity > 0'],
        triggers: [],
        procedures: ['sp_transfer_inventory'],
        views: [],
        columns: [
            { name: 'transfer_item_id', type: 'BIGINT UNSIGNED', nullable: false, isPK: true, autoInc: true, desc: 'Transfer line item ID' },
            { name: 'transfer_id', type: 'BIGINT UNSIGNED', nullable: false, isFK: true, fkTarget: 'stock_transfers.transfer_id', desc: 'FK -> stock_transfers(transfer_id) ON DELETE CASCADE' },
            { name: 'variant_id', type: 'BIGINT UNSIGNED', nullable: false, isFK: true, fkTarget: 'product_variants.variant_id', desc: 'FK -> product_variants(variant_id)' },
            { name: 'quantity', type: 'INT', nullable: false, desc: 'Quantity in transit (> 0)' }
        ],
        sampleRows: [
            { transfer_item_id: 1, transfer_id: 1, variant_id: 23, quantity: 20 },
            { transfer_item_id: 2, transfer_id: 1, variant_id: 2, quantity: 30 },
            { transfer_item_id: 3, transfer_id: 2, variant_id: 4, quantity: 25 }
        ]
    }
];

/**
 * All 32 Foreign Key Relationships across the 23 tables
 * Defined with exact source table/column, target PK table/column, ON DELETE rule, and ER label
 */
export const SCHEMA_RELATIONSHIPS = [
    // Domain A
    { id: 'fk_users_role', sourceTable: 'users', sourceCol: 'role_id', targetTable: 'roles', targetCol: 'role_id', cardinality: 'N:1', onDelete: 'RESTRICT', label: 'assigned to' },
    { id: 'fk_addresses_user', sourceTable: 'addresses', sourceCol: 'user_id', targetTable: 'users', targetCol: 'user_id', cardinality: 'N:1', onDelete: 'CASCADE', label: 'owns' },

    // Domain B
    { id: 'fk_categories_parent', sourceTable: 'categories', sourceCol: 'parent_category_id', targetTable: 'categories', targetCol: 'category_id', cardinality: 'N:1', onDelete: 'SET NULL', label: 'parent of', isSelf: true },
    { id: 'fk_products_category', sourceTable: 'products', sourceCol: 'category_id', targetTable: 'categories', targetCol: 'category_id', cardinality: 'N:1', onDelete: 'RESTRICT', label: 'categorizes' },
    { id: 'fk_products_brand', sourceTable: 'products', sourceCol: 'brand_id', targetTable: 'brands', targetCol: 'brand_id', cardinality: 'N:1', onDelete: 'RESTRICT', label: 'manufactures' },
    { id: 'fk_variants_product', sourceTable: 'product_variants', sourceCol: 'product_id', targetTable: 'products', targetCol: 'product_id', cardinality: 'N:1', onDelete: 'CASCADE', label: 'has SKU' },

    // Domain C
    { id: 'fk_inventory_store', sourceTable: 'store_inventory', sourceCol: 'store_id', targetTable: 'dark_stores', targetCol: 'store_id', cardinality: 'N:1', onDelete: 'RESTRICT', label: 'stocks' },
    { id: 'fk_inventory_variant', sourceTable: 'store_inventory', sourceCol: 'variant_id', targetTable: 'product_variants', targetCol: 'variant_id', cardinality: 'N:1', onDelete: 'RESTRICT', label: 'stocked in' },
    { id: 'fk_inv_tx_inventory', sourceTable: 'inventory_transactions', sourceCol: 'inventory_id', targetTable: 'store_inventory', targetCol: 'inventory_id', cardinality: 'N:1', onDelete: 'RESTRICT', label: 'audits' },

    // Domain D
    { id: 'fk_carts_user', sourceTable: 'carts', sourceCol: 'user_id', targetTable: 'users', targetCol: 'user_id', cardinality: 'N:1', onDelete: 'CASCADE', label: 'creates' },
    { id: 'fk_carts_store', sourceTable: 'carts', sourceCol: 'store_id', targetTable: 'dark_stores', targetCol: 'store_id', cardinality: 'N:1', onDelete: 'RESTRICT', label: 'tethered to' },
    { id: 'fk_cart_items_cart', sourceTable: 'cart_items', sourceCol: 'cart_id', targetTable: 'carts', targetCol: 'cart_id', cardinality: 'N:1', onDelete: 'CASCADE', label: 'contains' },
    { id: 'fk_cart_items_variant', sourceTable: 'cart_items', sourceCol: 'variant_id', targetTable: 'product_variants', targetCol: 'variant_id', cardinality: 'N:1', onDelete: 'CASCADE', label: 'selected SKU' },
    { id: 'fk_orders_user', sourceTable: 'orders', sourceCol: 'user_id', targetTable: 'users', targetCol: 'user_id', cardinality: 'N:1', onDelete: 'RESTRICT', label: 'places' },
    { id: 'fk_orders_store', sourceTable: 'orders', sourceCol: 'store_id', targetTable: 'dark_stores', targetCol: 'store_id', cardinality: 'N:1', onDelete: 'RESTRICT', label: 'fulfills' },
    { id: 'fk_orders_address', sourceTable: 'orders', sourceCol: 'address_id', targetTable: 'addresses', targetCol: 'address_id', cardinality: 'N:1', onDelete: 'RESTRICT', label: 'delivered to' },
    { id: 'fk_order_items_order', sourceTable: 'order_items', sourceCol: 'order_id', targetTable: 'orders', targetCol: 'order_id', cardinality: 'N:1', onDelete: 'CASCADE', label: 'line items' },
    { id: 'fk_order_items_variant', sourceTable: 'order_items', sourceCol: 'variant_id', targetTable: 'product_variants', targetCol: 'variant_id', cardinality: 'N:1', onDelete: 'RESTRICT', label: 'snapshot of' },
    { id: 'fk_order_history_order', sourceTable: 'order_status_history', sourceCol: 'order_id', targetTable: 'orders', targetCol: 'order_id', cardinality: 'N:1', onDelete: 'CASCADE', label: 'tracks state' },

    // Domain E
    { id: 'fk_res_order', sourceTable: 'stock_reservations', sourceCol: 'order_id', targetTable: 'orders', targetCol: 'order_id', cardinality: 'N:1', onDelete: 'CASCADE', label: 'reserves for' },
    { id: 'fk_res_variant', sourceTable: 'stock_reservations', sourceCol: 'variant_id', targetTable: 'product_variants', targetCol: 'variant_id', cardinality: 'N:1', onDelete: 'RESTRICT', label: 'locked SKU' },
    { id: 'fk_res_store', sourceTable: 'stock_reservations', sourceCol: 'store_id', targetTable: 'dark_stores', targetCol: 'store_id', cardinality: 'N:1', onDelete: 'RESTRICT', label: 'locked at hub' },

    // Domain F
    { id: 'fk_payments_order', sourceTable: 'payments', sourceCol: 'order_id', targetTable: 'orders', targetCol: 'order_id', cardinality: 'N:1', onDelete: 'RESTRICT', label: 'paid through' },
    { id: 'fk_refunds_payment', sourceTable: 'refunds', sourceCol: 'payment_id', targetTable: 'payments', targetCol: 'payment_id', cardinality: 'N:1', onDelete: 'RESTRICT', label: 'refunded via' },

    // Domain G
    { id: 'fk_partner_user', sourceTable: 'delivery_partners', sourceCol: 'user_id', targetTable: 'users', targetCol: 'user_id', cardinality: '1:1', onDelete: 'CASCADE', label: 'registered as' },
    { id: 'fk_deliveries_order', sourceTable: 'deliveries', sourceCol: 'order_id', targetTable: 'orders', targetCol: 'order_id', cardinality: '1:1', onDelete: 'RESTRICT', label: 'dispatched as' },
    { id: 'fk_deliveries_partner', sourceTable: 'deliveries', sourceCol: 'partner_id', targetTable: 'delivery_partners', targetCol: 'partner_id', cardinality: 'N:1', onDelete: 'SET NULL', label: 'assigned rider' },
    { id: 'fk_del_history_delivery', sourceTable: 'delivery_status_history', sourceCol: 'delivery_id', targetTable: 'deliveries', targetCol: 'delivery_id', cardinality: 'N:1', onDelete: 'CASCADE', label: 'logs dispatch' },

    // Domain H
    { id: 'fk_transfer_source', sourceTable: 'stock_transfers', sourceCol: 'source_store_id', targetTable: 'dark_stores', targetCol: 'store_id', cardinality: 'N:1', onDelete: 'RESTRICT', label: 'source hub' },
    { id: 'fk_transfer_dest', sourceTable: 'stock_transfers', sourceCol: 'destination_store_id', targetTable: 'dark_stores', targetCol: 'store_id', cardinality: 'N:1', onDelete: 'RESTRICT', label: 'dest hub' },
    { id: 'fk_transfer_items_transfer', sourceTable: 'stock_transfer_items', sourceCol: 'transfer_id', targetTable: 'stock_transfers', targetCol: 'transfer_id', cardinality: 'N:1', onDelete: 'CASCADE', label: 'includes' },
    { id: 'fk_transfer_items_variant', sourceTable: 'stock_transfer_items', sourceCol: 'variant_id', targetTable: 'product_variants', targetCol: 'variant_id', cardinality: 'N:1', onDelete: 'RESTRICT', label: 'rebalanced SKU' }
];

/**
 * Default Apple Notes / Freeform style sticky notes placed on the notebook canvas
 */
export const INITIAL_STICKY_NOTES = [
    {
        id: 'note-1',
        x: 90,
        y: 30,
        width: 290,
        color: '#fff3bf',
        border: '#fcc419',
        rotation: -1.2,
        title: '📌 3NF Schema Architecture',
        text: 'All 23 InnoDB tables are strictly normalized to 3NF. Drag any table card to rearrange, scroll/pinch to zoom, or pick the Marker tool below to sketch on the page!'
    },
    {
        id: 'note-2',
        x: 680,
        y: 30,
        width: 310,
        color: '#e6fcf5',
        border: '#20c997',
        rotation: 0.8,
        title: '⚡ ACID Checkout (sp_place_order)',
        text: 'Orders snapshot delivery_address & unit_price at purchase time so future catalogue price edits never corrupt historical invoices.'
    },
    {
        id: 'note-3',
        x: 1290,
        y: 30,
        width: 300,
        color: '#fff0f6',
        border: '#f06595',
        rotation: -0.7,
        title: '🔒 Pessimistic Stock Locking',
        text: 'store_inventory enforces reserved_quantity <= total_quantity with SELECT ... FOR UPDATE row locks + 15-min stock_reservations.'
    }
];

