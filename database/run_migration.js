/**
 * QuickKart: Quick-Commerce Management System
 * Database Migration & Seeding Runner
 * 
 * Supports executing Phase 1 and Phase 2 scripts.
 * Usage:
 *   node database/run_migration.js [--phase=1|2|all] [--password=your_pwd]
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function findMySQL() {
    const candidates = [
        'mysql',
        'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe',
        'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysql.exe',
        'C:\\Program Files (x86)\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe',
        'C:\\xampp\\mysql\\bin\\mysql.exe'
    ];

    for (const bin of candidates) {
        try {
            const check = spawnSync(bin, ['--version'], { encoding: 'utf8' });
            if (check.status === 0 || (check.stdout && check.stdout.includes('Distrib'))) {
                return bin;
            }
        } catch (e) {
            // continue
        }
    }
    return 'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe';
}

function getDbCredentials() {
    let host = process.env.DB_HOST || '127.0.0.1';
    let port = process.env.DB_PORT || '3306';
    let user = process.env.DB_USER || 'root';
    let password = process.env.DB_PASSWORD || process.env.MYSQL_PWD || '';

    const passArg = process.argv.find(a => a.startsWith('--password=') || a.startsWith('-p='));
    if (passArg) {
        password = passArg.split('=')[1];
    }

    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('DB_HOST=')) host = trimmed.split('=')[1].trim();
            if (trimmed.startsWith('DB_PORT=')) port = trimmed.split('=')[1].trim();
            if (trimmed.startsWith('DB_USER=')) user = trimmed.split('=')[1].trim();
            if (trimmed.startsWith('DB_PASSWORD=')) password = trimmed.split('=')[1].trim();
        });
    }

    return { host, port, user, password };
}

function getSelectedPhase() {
    const phaseArg = process.argv.find(a => a.startsWith('--phase='));
    if (phaseArg) {
        return phaseArg.split('=')[1].toLowerCase();
    }
    return 'all'; // default to running everything
}

async function run() {
    const mysqlBin = findMySQL();
    const creds = getDbCredentials();
    const phase = getSelectedPhase();

    console.log('====================================================');
    console.log('       QuickKart Database Setup (Phases 1 & 2)');
    console.log('====================================================');
    console.log(`Using MySQL Binary: ${mysqlBin}`);
    console.log(`Host Connection:    ${creds.user}@${creds.host}:${creds.port}`);
    console.log(`Target Phase:       ${phase.toUpperCase()}`);

    const phase1Files = [
        '01_create_database.sql',
        '02_create_tables.sql',
        '03_constraints_indexes.sql',
        '04_sample_data.sql'
    ];

    const phase2Files = [
        '05_views.sql',
        '06_functions.sql',
        '07_procedures.sql',
        '08_triggers.sql',
        '09_test_queries.sql'
    ];

    let sqlFiles = [];
    if (phase === '1') sqlFiles = phase1Files;
    else if (phase === '2') sqlFiles = phase2Files;
    else sqlFiles = [...phase1Files, ...phase2Files];

    const env = { ...process.env, MYSQL_PWD: creds.password };

    for (const file of sqlFiles) {
        const filePath = path.join(__dirname, file);
        if (!fs.existsSync(filePath)) {
            console.error(`[ERROR] File not found: ${file}`);
            process.exit(1);
        }

        console.log(`\n--> Executing ${file}...`);
        const args = ['-h', creds.host, '-P', creds.port, '-u', creds.user];
        if (creds.password) {
            args.push(`-p${creds.password}`);
        }

        try {
            const sqlContent = fs.readFileSync(filePath, 'utf8');
            const result = spawnSync(mysqlBin, args, {
                input: sqlContent,
                encoding: 'utf8',
                env
            });

            if (result.status !== 0) {
                console.error(`[FAIL] ${file} exited with error code ${result.status}:`);
                console.error(result.stderr || result.stdout);
                process.exit(1);
            }

            console.log(`[PASS] ${file} completed successfully.`);
            if (result.stdout.trim()) {
                console.log(result.stdout.trim());
            }
        } catch (err) {
            console.error(`[ERROR] Execution failed for ${file}:`, err.message);
            process.exit(1);
        }
    }

    console.log('\n====================================================');
    console.log('  All Selected Database Modules Completed Successfully!');
    console.log('====================================================');

    // Verification summary
    try {
        const verifyQuery = `
            USE quickkart_db;
            SELECT 'Tables Created' AS Metric, COUNT(*) AS Total FROM information_schema.tables WHERE table_schema='quickkart_db' AND table_type='BASE TABLE'
            UNION ALL
            SELECT 'Views Created', COUNT(*) FROM information_schema.views WHERE table_schema='quickkart_db'
            UNION ALL
            SELECT 'Stored Procedures', COUNT(*) FROM information_schema.routines WHERE routine_schema='quickkart_db' AND routine_type='PROCEDURE'
            UNION ALL
            SELECT 'Stored Functions', COUNT(*) FROM information_schema.routines WHERE routine_schema='quickkart_db' AND routine_type='FUNCTION'
            UNION ALL
            SELECT 'Triggers Registered', COUNT(*) FROM information_schema.triggers WHERE trigger_schema='quickkart_db'
            UNION ALL
            SELECT 'Sample Orders', COUNT(*) FROM orders;
        `;

        const args = ['-h', creds.host, '-P', creds.port, '-u', creds.user, '-t'];
        if (creds.password) args.push(`-p${creds.password}`);

        const checkRes = spawnSync(mysqlBin, args, {
            input: verifyQuery,
            encoding: 'utf8',
            env
        });

        if (checkRes.status === 0) {
            console.log('\nDatabase Health & Object Count Summary:');
            console.log(checkRes.stdout);
        }
    } catch (e) {
        // ignore
    }
}

run();
