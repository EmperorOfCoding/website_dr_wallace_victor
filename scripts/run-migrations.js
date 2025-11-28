const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function runMigrations() {
    let connection;

    try {
        // 1. Conectar ao banco
        connection = await mysql.createConnection({
            host: process.env.MYSQLHOST,
            user: process.env.MYSQLUSER,
            password: process.env.MYSQLPASSWORD,
            database: process.env.MYSQLDATABASE,
            port: process.env.MYSQLPORT || 3306
        });

        console.log('Connected to database.');

        // 2. Diretório das migrations
        const migrationsDir = path.join(__dirname, '../migrations');
        if (!fs.existsSync(migrationsDir)) {
            console.log('Migrations directory not found.');
            process.exit(0);
        }

        const files = fs.readdirSync(migrationsDir).sort();

        // 3. Executar cada migration
        for (const file of files) {
            if (!file.endsWith('.sql')) continue;

            console.log(`Processing migration file: ${file}`);

            const filePath = path.join(migrationsDir, file);
            const sqlContent = fs.readFileSync(filePath, 'utf8');

            const statements = parseSqlStatements(sqlContent);

            for (const statement of statements) {
                if (!statement.trim()) continue;

                try {
                    await connection.query(statement);
                } catch (err) {
                    console.error(`✗ Error executing statement in ${file}:`);
                    console.error(statement.substring(0, 200) + '...');
                    console.error(err.message);
                    process.exit(1);
                }
            }

            console.log(`✓ Migration ${file} executed successfully.`);
        }

        console.log('All migrations completed.');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

function parseSqlStatements(sql) {
    const statements = [];
    let current = '';
    let delimiter = ';';

    const lines = sql.split('\n');

    for (let line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith('DELIMITER')) {
            delimiter = trimmed.split(' ')[1];
            continue;
        }

        if (trimmed.endsWith(delimiter)) {
            const noDel = line.substring(0, line.lastIndexOf(delimiter));
            current += noDel;
            statements.push(current);
            current = '';
        } else {
            current += line + '\n';
        }
    }

    if (current.trim()) statements.push(current);

    return statements;
}

runMigrations();
