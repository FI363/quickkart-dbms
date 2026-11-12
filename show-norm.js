#!/usr/bin/env node

/**
 * QuickKart DBMS — Live Terminal Normalization Demonstration
 * 
 * Shows your evaluator in real-time in the terminal:
 *  - STEP 0: Unnormalized Base Table (UNF / 0NF) with multi-valued repeating groups
 *  - STEP 1: First Normal Form (1NF) with atomic values and composite PK
 *  - STEP 2: Second Normal Form (2NF) eliminating Partial Dependencies
 *  - STEP 3: Third Normal Form (3NF) eliminating Transitive Dependencies
 *  - STEP 4: Boyce-Codd Normal Form (BCNF) verifying superkey determinants
 *  - STEP 5: Fourth Normal Form (4NF) eliminating Multi-Valued Dependencies (Cartesian bloat)
 * 
 * Usage:
 *   node show-norm.js
 *   node show-norm.js 1
 *   node show-norm.js 2
 *   node show-norm.js 3
 *   node show-norm.js bcnf
 *   node show-norm.js 4
 */

const path = require('path');
const mysql = require(path.join(__dirname, 'backend', 'node_modules', 'mysql2', 'promise'));
const fs = require('fs');

function loadEnv() {
    const config = {
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: '',
        database: 'quickkart_db'
    };
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const lines = fs.readFileSync(envPath, 'utf8').split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('DB_HOST=')) config.host = trimmed.split('=')[1].trim();
            if (trimmed.startsWith('DB_PORT=')) config.port = parseInt(trimmed.split('=')[1].trim(), 10);
            if (trimmed.startsWith('DB_USER=')) config.user = trimmed.split('=')[1].trim();
            if (trimmed.startsWith('DB_PASSWORD=')) config.password = trimmed.split('=')[1].trim();
            if (trimmed.startsWith('DB_NAME=')) config.database = trimmed.split('=')[1].trim();
        }
    }
    return config;
}

const C = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    magenta: '\x1b[35m',
    red: '\x1b[31m',
    bgBlue: '\x1b[44m\x1b[37m',
    gray: '\x1b[90m'
};

function banner(step, title, rule) {
    console.log(`\n${C.bold}${C.cyan}================================================================================${C.reset}`);
    console.log(`${C.bold}${C.green}[${step}] ${title}${C.reset}`);
    console.log(`${C.yellow}Rule:${C.reset} ${rule}`);
    console.log(`${C.cyan}================================================================================${C.reset}\n`);
}

async function showStep0() {
    banner(
        'STEP 0: BASE STATE (UNF / 0NF)',
        'Unnormalized Order Register',
        'Raw invoice record where items, customer details, and status timelines are multi-valued strings.'
    );
    console.log(`${C.red}VIOLATIONS:${C.reset}`);
    console.log(` • 'purchased_items' is a repeating group (2 items packed into one cell).`);
    console.log(` • 'customer_info' and 'store_info' are non-atomic composite strings.`);
    console.log(` • Inability to index, aggregate, or calculate totals with standard SQL.\n`);

    const unfData = [
        {
            order_id: '1',
            order_number: 'ORD-2026-0001',
            customer_info: '12 | Aravind S | +919840444441',
            store_info: '1 | T. Nagar Hub | 600017',
            purchased_items: 'Amul Milk (2 x ₹27 = ₹54), Britannia Bread (1 x ₹45 = ₹45)',
            status_timeline: '08:30 PENDING, 08:31 CONFIRMED, 08:49 DELIVERED'
        },
        {
            order_id: '2',
            order_number: 'ORD-2026-0002',
            customer_info: '13 | Divya N | +919840444442',
            store_info: '2 | Adyar Hub | 600020',
            purchased_items: 'Amul Paneer (1 x ₹92 = ₹92), Farm Eggs (1 x ₹42 = ₹42)',
            status_timeline: '09:15 PENDING, 09:16 CONFIRMED, 09:34 DELIVERED'
        }
    ];
    console.table(unfData);
}

async function showStep1(conn) {
    banner(
        'STEP 1: FIRST NORMAL FORM (1NF)',
        'Flattening Multi-Valued Attributes into Atomic Rows',
        'Every cell must hold a single scalar value; no repeating groups; composite primary key (order_id, variant_id).'
    );
    console.log(`${C.green}WHAT WAS FIXED:${C.reset}`);
    console.log(` • Repeating item list unnested into individual rows.`);
    console.log(` • Every item quantity and unit price is now an atomic number.\n`);

    const [rows] = await conn.query(`
        SELECT 
            oi.order_id,
            oi.variant_id,
            o.order_number,
            u.full_name AS customer_name,
            s.store_name,
            oi.product_name_snapshot,
            oi.quantity,
            oi.unit_price,
            oi.subtotal
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.order_id
        JOIN users u ON o.user_id = u.user_id
        JOIN dark_stores s ON o.store_id = s.store_id
        WHERE o.order_id IN (1, 2);
    `);
    console.table(rows);

    console.log(`\n${C.red}WHY 1NF STILL FAILS 2NF (Partial Dependency):${C.reset}`);
    console.log(` • Candidate Key is {order_id, variant_id}.`);
    console.log(` • 'quantity' and 'unit_price' depend on BOTH {order_id, variant_id} (Full dependency).`);
    console.log(` • But 'customer_name' and 'store_name' depend ONLY on 'order_id' (Partial dependency!)`);
    console.log(` • If an order has 10 items, customer_name is redundantly duplicated 10 times.`);
}

async function showStep2(conn) {
    banner(
        'STEP 2: SECOND NORMAL FORM (2NF)',
        'Eliminating Partial Functional Dependencies',
        'In 1NF + every non-key column must depend on the ENTIRE candidate key. Split into Order_Header and order_items.'
    );
    console.log(`${C.green}WHAT WAS FIXED:${C.reset}`);
    console.log(` • Separated order-level attributes from SKU-level line items.\n`);

    console.log(`${C.bold}Table 2A: order_items (Fully dependent on {order_id, variant_id})${C.reset}`);
    const [items] = await conn.query(`
        SELECT 
            order_item_id,
            order_id,
            variant_id,
            product_name_snapshot,
            quantity,
            unit_price,
            subtotal
        FROM order_items
        WHERE order_id IN (1, 2);
    `);
    console.table(items);

    console.log(`\n${C.bold}Table 2B: Order_Header_2NF (Dependent only on {order_id})${C.reset}`);
    const [headers] = await conn.query(`
        SELECT 
            o.order_id,
            o.order_number,
            o.user_id,
            u.full_name AS customer_name,
            u.phone AS customer_phone,
            o.store_id,
            s.store_name,
            s.area AS store_area,
            o.total_amount
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        JOIN dark_stores s ON o.store_id = s.store_id
        WHERE o.order_id IN (1, 2);
    `);
    console.table(headers);

    console.log(`\n${C.red}WHY 2NF STILL FAILS 3NF (Transitive Dependency):${C.reset}`);
    console.log(` • In Order_Header_2NF: order_id -> user_id -> customer_name, customer_phone.`);
    console.log(` • In Order_Header_2NF: order_id -> store_id -> store_name, store_area.`);
    console.log(` • Non-key attributes (customer_name) depend on non-key attributes (user_id).`);
    console.log(` • If customer changes phone number, we would have to update multiple order records!`);
}

async function showStep3(conn) {
    banner(
        'STEP 3: THIRD NORMAL FORM (3NF)',
        'Eliminating Transitive Dependencies (X -> Y -> Z)',
        'Non-key attributes cannot depend on other non-key attributes. Extract users and dark_stores.'
    );
    console.log(`${C.green}WHAT WAS FIXED:${C.reset}`);
    console.log(` • 'users' and 'dark_stores' extracted into their own master tables.`);
    console.log(` • 'orders' table now keeps only foreign keys (user_id, store_id, address_id).\n`);

    console.log(`${C.bold}Table 3A: Live 'orders' table (Strict 3NF)${C.reset}`);
    const [orders] = await conn.query(`
        SELECT 
            order_id,
            order_number,
            user_id,
            store_id,
            address_id,
            subtotal,
            delivery_fee,
            total_amount,
            order_status
        FROM orders
        WHERE order_id IN (1, 2, 3);
    `);
    console.table(orders);

    console.log(`\n${C.bold}Table 3B: Master 'users' table (Extracted to prevent TD)${C.reset}`);
    const [users] = await conn.query(`
        SELECT user_id, role_id, full_name, email, phone, account_status
        FROM users
        WHERE user_id IN (12, 13, 14);
    `);
    console.table(users);

    console.log(`\n${C.bold}Table 3C: Master 'dark_stores' table (Extracted to prevent TD)${C.reset}`);
    const [stores] = await conn.query(`
        SELECT store_id, store_name, area, pincode, service_radius_km
        FROM dark_stores;
    `);
    console.table(stores);
}

async function showStepBCNF(conn) {
    banner(
        'STEP 4: BOYCE-CODD NORMAL FORM (BCNF / 3.5NF)',
        'Every Determinant Must Be a Superkey',
        'Stronger version of 3NF: For every non-trivial functional dependency X -> Y, X must be a candidate key.'
    );
    console.log(`${C.green}BCNF VERIFICATION ON 'orders':${C.reset}`);
    console.log(` • Candidate Key 1: {order_id} (Primary Key)`);
    console.log(` • Candidate Key 2: {order_number} (Unique Business Key)`);
    console.log(` • FD1: order_id -> user_id, store_id, total_amount, order_status  (order_id is Superkey -> OK)`);
    console.log(` • FD2: order_number -> order_id, user_id, store_id, total_amount (order_number is Superkey -> OK)`);
    console.log(` • There are ZERO overlapping candidate key anomalies.\n`);

    const [bcnfCheck] = await conn.query(`
        SELECT 
            order_id AS 'Candidate_Key_1',
            order_number AS 'Candidate_Key_2',
            total_amount,
            order_status
        FROM orders
        LIMIT 3;
    `);
    console.table(bcnfCheck);
}

async function showStep4(conn) {
    banner(
        'STEP 5: FOURTH NORMAL FORM (4NF)',
        'Eliminating Multi-Valued Dependencies (MVDs: X ↠ Y independent of X ↠ Z)',
        'Prevents Cartesian product explosion when one entity has two independent one-to-many relationships.'
    );
    console.log(`${C.red}THE MVD ANOMALY IF COMBINED IN ONE TABLE:${C.reset}`);
    console.log(` • An order has multiple line items (order_id ↠ variant_id).`);
    console.log(` • An order has multiple tracking updates (order_id ↠ status_transition).`);
    console.log(` • If combined into one table, 2 items x 4 status updates = 8 redundant rows!\n`);

    console.log(`${C.green}4NF DECOMPOSITION IN QUICKKART DB:${C.reset}`);
    console.log(` • Table 4A: 'order_items' (order_id ↠ variant_id, quantity) -> 2 rows`);
    console.log(` • Table 4B: 'order_status_history' (order_id ↠ status_transition) -> 5 rows`);
    console.log(` • Total clean rows: 2 + 5 = 7 rows (instead of 2 x 5 = 10 Cartesian bloat rows)\n`);

    console.log(`${C.bold}Live 4NF Table A: order_items for Order #1 (2 items)${C.reset}`);
    const [items] = await conn.query(`
        SELECT order_item_id, order_id, product_name_snapshot, quantity, unit_price
        FROM order_items
        WHERE order_id = 1;
    `);
    console.table(items);

    console.log(`\n${C.bold}Live 4NF Table B: order_status_history for Order #1 (5 status transitions)${C.reset}`);
    const [history] = await conn.query(`
        SELECT history_id, order_id, previous_status, new_status, changed_at, remarks
        FROM order_status_history
        WHERE order_id = 1;
    `);
    console.table(history);
}

async function main() {
    const config = loadEnv();
    let conn;
    try {
        conn = await mysql.createConnection(config);
    } catch (e) {
        console.error(`Database connection error: ${e.message}`);
        process.exit(1);
    }

    const arg = (process.argv[2] || 'all').toLowerCase();

    if (arg === '0' || arg === 'unf') {
        await showStep0();
    } else if (arg === '1' || arg === '1nf') {
        await showStep1(conn);
    } else if (arg === '2' || arg === '2nf') {
        await showStep2(conn);
    } else if (arg === '3' || arg === '3nf') {
        await showStep3(conn);
    } else if (arg === 'bcnf' || arg === '3.5' || arg === '3.5nf') {
        await showStepBCNF(conn);
    } else if (arg === '4' || arg === '4nf') {
        await showStep4(conn);
    } else if (['customer', 'customers', 'product', 'products', 'order', 'orders', 'payment', 'payments', 'delivery', 'deliveries', 'sales', 'stock', 'tables', 'routines'].includes(arg)) {
        // Delegate entity inspection directly to dba.js
        await conn.end();
        require('./dba.js');
        return;
    } else {
        // Run entire sequence
        console.log(`\n${C.bold}${C.bgBlue} QUICKKART DBMS — FULL NORMALIZATION DEMONSTRATION (UNF -> 1NF -> 2NF -> 3NF -> BCNF -> 4NF) ${C.reset}\n`);
        await showStep0();
        await showStep1(conn);
        await showStep2(conn);
        await showStep3(conn);
        await showStepBCNF(conn);
        await showStep4(conn);
        console.log(`\n${C.bold}${C.green}✓ All 5 stages displayed with live MySQL tables!${C.reset}\n`);
    }

    await conn.end();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});

