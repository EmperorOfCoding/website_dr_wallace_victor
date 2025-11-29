const mysql = require('mysql2/promise');

function requireEnvVar(name) {
    const value = process.env[name];
    if (!value) {
        console.error(`❌ Erro: Variável de ambiente ${name} não está definida.`);
        console.error('💡 Configure as variáveis de ambiente antes de executar este script:');
        console.error('   - DB_HOST');
        console.error('   - DB_USER');
        console.error('   - DB_PASSWORD');
        console.error('   - DB_NAME (opcional, padrão: dr_wallace)');
        process.exit(1);
    }
    return value;
}

async function createDatabase() {
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

    const dbName = process.env.DB_NAME || 'dr_wallace';

    console.log(`🔧 Criando banco de dados "${dbName}"...\n`);

    let connection;
    try {
        connection = await mysql.createConnection(config);
        console.log('✅ Conectado ao servidor MySQL!\n');

        // Criar o banco de dados
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`✅ Banco de dados "${dbName}" criado com sucesso!\n`);

        // Verificar se foi criado
        const [databases] = await connection.execute('SHOW DATABASES');
        const dbExists = databases.some((db) => db.Database === dbName);

        if (dbExists) {
            console.log(`✅ Confirmação: Banco "${dbName}" existe e está pronto para uso!`);
            console.log('\n💡 Próximos passos:');
            console.log('   - Execute o schema SQL para criar as tabelas');
            console.log('   - Execute o DML SQL para inserir dados iniciais (opcional)');
        }

    } catch (err) {
        console.error(`❌ Erro: ${err.message}`);
        if (err.code === 'ER_DB_CREATE_EXISTS') {
            console.log(`\nℹ️  O banco "${dbName}" já existe.`);
        }
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

createDatabase().catch(console.error);

