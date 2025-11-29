const mysql = require('mysql2/promise');

function requireEnvVar(name) {
    const value = process.env[name];
    if (!value) {
        console.error(`❌ Erro: Variável de ambiente ${name} não está definida.`);
        console.error('💡 Configure as variáveis de ambiente antes de executar este script:');
        console.error('   - DB_HOST');
        console.error('   - DB_USER');
        console.error('   - DB_PASSWORD');
        process.exit(1);
    }
    return value;
}

async function listDatabases() {
    // Require essential environment variables
    const host = requireEnvVar('DB_HOST');
    const user = requireEnvVar('DB_USER');
    const password = requireEnvVar('DB_PASSWORD');

    const config = {
        host,
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
        user,
        password,
        connectTimeout: 10000,
    };

    console.log('🔍 Listando bancos de dados disponíveis...\n');

    let connection;
    try {
        connection = await mysql.createConnection(config);
        console.log('✅ Conectado ao servidor MySQL!\n');

        const [databases] = await connection.execute('SHOW DATABASES');
        console.log('📊 Bancos de dados disponíveis:');
        databases.forEach((db) => {
            console.log(`   - ${db.Database}`);
        });

        // Verificar se dr_wallace existe
        const dbExists = databases.some((db) => db.Database === 'dr_wallace');
        if (!dbExists) {
            console.log('\n⚠️  O banco "dr_wallace" não existe.');
            console.log('💡 Você pode criar usando: CREATE DATABASE dr_wallace;');
        } else {
            console.log('\n✅ O banco "dr_wallace" existe!');
        }

    } catch (err) {
        console.error(`❌ Erro: ${err.message}`);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

listDatabases().catch(console.error);

