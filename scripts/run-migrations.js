const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigrations() {
    console.log('Starting migrations...');

    const config = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true
    };

    console.log(`Connecting to database ${config.database} at ${config.host}:${config.port}...`);

    let connection;
    try {
        connection = await mysql.createConnection(config);
        console.log('Connected to database.');

        const migrationsDir = path.join(__dirname, '../migrations');
        if (!fs.existsSync(migrationsDir)) {
            console.log('Migrations directory not found.');
            process.exit(0);
        }

        const files = fs.readdirSync(migrationsDir).sort();

        for (const file of files) {
            if (file.endsWith('.sql')) {
                console.log(`Processing migration file: ${file}`);
                const filePath = path.join(migrationsDir, file);
                const sqlContent = fs.readFileSync(filePath, 'utf8');

                // Custom parser to handle DELIMITER
                const statements = parseSqlStatements(sqlContent);

                for (const statement of statements) {
                    if (statement.trim()) {
                        try {
                            await connection.query(statement);
                        } catch (err) {
                            console.error(`✗ Error executing statement in ${file}:`);
                            console.error(statement.substring(0, 100) + '...');
                            console.error(err.message);
                            // Check if error is "Table already exists" or similar, maybe ignore?
                            // For now, we exit on error to be safe.
                            process.exit(1);
                        }
                    }
                }
                console.log(`✓ Migration ${file} executed successfully.`);
            }
        }

        console.log('All migrations completed.');
        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

function parseSqlStatements(sql) {
    const statements = [];
    let currentStatement = '';
    let delimiter = ';';
    const lines = sql.split('\n');

    for (let line of lines) {
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith('DELIMITER')) {
            delimiter = trimmedLine.split(' ')[1];
            continue;
        }

        if (trimmedLine.endsWith(delimiter)) {
            // Remove delimiter from the end of the line
            const lineWithoutDelimiter = line.substring(0, line.lastIndexOf(delimiter));
            currentStatement += lineWithoutDelimiter;

            // If the delimiter was //, we usually want to append a ; for the SQL syntax if it was a trigger/procedure
            // But mysql2 query() expects the statement. 
            // For CREATE TRIGGER ... END// -> We want CREATE TRIGGER ... END
            // But wait, inside the trigger we have semicolons. 
            // If we send "CREATE TRIGGER ... BEGIN ...; END", mysql2 handles it as one query.

            statements.push(currentStatement);
            currentStatement = '';
        } else {
            currentStatement += line + '\n';
        }
    }

    // Catch any remaining statement
    if (currentStatement.trim()) {
        statements.push(currentStatement);
    }

    return statements;
}

runMigrations();
