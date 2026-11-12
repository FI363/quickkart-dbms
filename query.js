#!/usr/bin/env node

/**
 * QuickKart DBMS — Interactive SQL CLI & Query Runner
 * 
 * Run raw SQL queries, .sql script files, or enter an interactive SQL REPL
 * directly from your IDE terminal without typing complex connection flags.
 * 
 * Usage:
 *   node query.js "SELECT * FROM roles;"
 *   node query.js database/09_test_queries.sql
 *   node query.js --table=products
 *   node query.js --repl (or just node query.js)
 *   npm run sql "SELECT * FROM dark_stores;"
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const mysql = require(path.join(__dirname, 'backend', 'node_modules', 'mysql2', 'promise'));

// Load database credentials from root .env or backend/.env
function loadEnv() {
    const candidates = [
        path.join(__dirname, '.env'),
        path.join(__dirname, 'backend', '.env')
    ];

    const config = {
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'quickkart_db'
    };

    for (const envPath of candidates) {
        if (fs.existsSync(envPath)) {
            const lines = fs.readFileSync(envPath, 'utf8').split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) continue;
                const idx = trimmed.indexOf('=');
                if (idx > -1) {
                    const key = trimmed.slice(0, idx).trim();
                    const val = trimmed.slice(idx + 1).trim();
                    if (key === 'DB_HOST') config.host = val;
                    if (key === 'DB_PORT') config.port = parseInt(val, 10);
                    if (key === 'DB_USER') config.user = val;
                    if (key === 'DB_PASSWORD') config.password = val;
                    if (key === 'DB_NAME') config.database = val;
                }
            }
            break;
        }
    }

    return config;
}

// Pretty print arrays of objects in terminal table style
function printTableResults(rows) {
    if (!rows || rows.length === 0) {
        console.log('Query returned 0 rows / Empty set.');
        return;
    }

    if (!Array.isArray(rows)) {
        // e.g., OkPacket, ResultSetHeader
        console.log(rows);
        return;
    }

    // Format dates and decimal values cleanly
    const formatted = rows.map(row => {
        const clean = {};
        for (const [k, v] of Object.entries(row)) {
            if (v instanceof Date) {
                clean[k] = v.toISOString().replace('T', ' ').slice(0, 19);
            } else if (v === null || v === undefined) {
                clean[k] = 'NULL';
            } else {
                clean[k] = v;
            }
        }
        return clean;
    });

    console.table(formatted);
    console.log(`(${rows.length} ${rows.length === 1 ? 'row' : 'rows'} in set)`);
}

async function executeQuery(conn, sql) {
    const trimmed = sql.trim().replace(/;+$/, '');
    if (!trimmed) return;

    const lower = trimmed.toLowerCase();

    // Built-in convenience shortcuts
    if (lower === 'tables' || lower === '\\dt' || lower === 'show tables') {
        const [rows] = await conn.query('SHOW FULL TABLES;');
        printTableResults(rows);
        return;
    }
    if (lower.startsWith('desc ') || lower.startsWith('describe ')) {
        const [rows] = await conn.query(trimmed);
        printTableResults(rows);
        return;
    }

    const start = Date.now();
    try {
        const [rows] = await conn.query(trimmed);
        const duration = (Date.now() - start);

        if (Array.isArray(rows)) {
            printTableResults(rows);
        } else {
            console.log(`Query OK, ${rows.affectedRows || 0} row(s) affected (${duration} ms)`);
            if (rows.insertId) console.log(`Last Insert ID: ${rows.insertId}`);
        }
    } catch (err) {
        console.error(`\x1b[31mSQL Error:\x1b[0m ${err.message}`);
    }
}

async function runInteractiveRepl(conn, config) {
    console.log('\x1b[32m====================================================================\x1b[0m');
    console.log(`\x1b[1mQuickKart Interactive SQL Shell\x1b[0m — Connected to \x1b[36m${config.database}\x1b[0m on ${config.host}:${config.port}`);
    console.log('Type any SQL query (e.g. \x1b[33mSELECT * FROM users LIMIT 5;\x1b[0m)');
    console.log('Shortcuts: \x1b[33mtables\x1b[0m | \x1b[33mdesc <table_name>\x1b[0m | \x1b[33mclear\x1b[0m | \x1b[33mexit\x1b[0m');
    console.log('\x1b[32m====================================================================\x1b[0m\n');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: `quickkart_db> `
    });

    rl.prompt();

    let buffer = '';

    rl.on('line', async (line) => {
        const trimmed = line.trim();

        if (trimmed.toLowerCase() === 'exit' || trimmed.toLowerCase() === 'quit' || trimmed === '\\q') {
            rl.close();
            return;
        }
        if (trimmed.toLowerCase() === 'clear' || trimmed === '\\c') {
            console.clear();
            rl.prompt();
            return;
        }

        buffer += (buffer ? ' ' : '') + trimmed;

        // If statement ends with semicolon or is a single-word shortcut, execute it
        if (buffer.endsWith(';') || buffer.toLowerCase() === 'tables') {
            await executeQuery(conn, buffer);
            buffer = '';
            console.log('');
            rl.setPrompt(`quickkart_db> `);
        } else if (buffer.length > 0) {
            rl.setPrompt(`    -> `);
        }

        rl.prompt();
    });

    rl.on('close', async () => {
        console.log('\nBye.');
        await conn.end();
        process.exit(0);
    });
}

async function main() {
    const config = loadEnv();
    const args = process.argv.slice(2);

    let conn;
    try {
        conn = await mysql.createConnection({
            host: config.host,
            port: config.port,
            user: config.user,
            password: config.password,
            database: config.database,
            multipleStatements: true
        });
    } catch (err) {
        console.error(`\x1b[31mFailed to connect to MySQL database '${config.database}':\x1b[0m ${err.message}`);
        console.error(`Check DB_USER & DB_PASSWORD in .env or verify the MySQL service is running.`);
        process.exit(1);
    }

    // Scenario 1: No arguments or --repl -> launch interactive REPL
    if (args.length === 0 || args[0] === '--repl' || args[0] === '-i') {
        await runInteractiveRepl(conn, config);
        return;
    }

    // Scenario 2: Quick table inspect via --table=name or -t name
    const tableArg = args.find(a => a.startsWith('--table='));
    if (tableArg) {
        const tbl = tableArg.split('=')[1];
        await executeQuery(conn, `SELECT * FROM \`${tbl}\` LIMIT 20;`);
        await conn.end();
        return;
    }

    const inputArg = args[0];

    // Scenario 3: SQL file path provided (e.g., node query.js database/09_test_queries.sql)
    if (fs.existsSync(inputArg) && (inputArg.endsWith('.sql') || fs.statSync(inputArg).isFile())) {
        console.log(`Executing SQL Script: \x1b[36m${inputArg}\x1b[0m...\n`);
        const sqlContent = fs.readFileSync(inputArg, 'utf8');

        // Split statements carefully by semicolon outside delimiter blocks
        const statements = sqlContent
            .split(/;\s*[\r\n]+/)
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

        for (const stmt of statements) {
            // Echo comments if any
            const lines = stmt.split('\n');
            const commentLines = lines.filter(l => l.trim().startsWith('--')).join('\n');
            if (commentLines) {
                console.log(`\x1b[33m${commentLines}\x1b[0m`);
            }
            const cleanStmt = lines.filter(l => !l.trim().startsWith('--')).join('\n').trim();
            if (cleanStmt) {
                await executeQuery(conn, cleanStmt);
                console.log('');
            }
        }
        await conn.end();
        return;
    }

    // Scenario 4: Inline query string provided
    // Combine all remaining arguments in case shell split by spaces without quotes
    const queryStr = args.join(' ');
    await executeQuery(conn, queryStr);
    await conn.end();
}

main().catch(err => {
    console.error('Fatal CLI Error:', err);
    process.exit(1);
});

