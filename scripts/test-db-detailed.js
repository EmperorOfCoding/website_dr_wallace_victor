const mysql = require('mysql2/promise');
const dns = require('dns').promises;

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

async function testConnection() {
    // Require essential environment variables
    const host = requireEnvVar('DB_HOST');
    const user = requireEnvVar('DB_USER');
    const password = requireEnvVar('DB_PASSWORD');

    const config = {
        host,
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
        user,
        password,
        database: process.env.DB_NAME || 'dr_wallace',
        connectTimeout: 10000, // 10 segundos
    };

    console.log('🔍 Testando conexão com o banco de dados...\n');
    console.log('Configuração:');
    console.log(`  Host: ${config.host}`);
    console.log(`  Port: ${config.port}`);
    console.log(`  User: ${config.user}`);
    console.log(`  Database: ${config.database}\n`);

    // Teste 1: Resolução DNS
    try {
        console.log('1️⃣ Testando resolução DNS...');
        const addresses = await dns.resolve4(config.host);
        console.log(`   ✅ DNS resolvido: ${addresses.join(', ')}\n`);
    } catch (err) {
        console.log(`   ❌ Erro na resolução DNS: ${err.message}\n`);
        return;
    }

    // Teste 2: Conexão MySQL
    let connection;
    try {
        console.log('2️⃣ Tentando conectar ao MySQL...');
        connection = await mysql.createConnection(config);
        console.log('   ✅ Conexão estabelecida com sucesso!\n');

        // Teste 3: Query simples
        console.log('3️⃣ Executando query de teste...');
        const [rows] = await connection.execute('SELECT 1 AS ok, NOW() AS server_time, DATABASE() AS current_db');
        console.log('   ✅ Query executada com sucesso!');
        console.log('   Resultado:', rows[0]);
        console.log('\n✅ Todos os testes passaram! Conexão funcionando perfeitamente.');

    } catch (err) {
        console.log(`   ❌ Erro na conexão: ${err.message}`);
        console.log(`   Código do erro: ${err.code}`);

        if (err.code === 'ETIMEDOUT') {
            console.log('\n💡 Dica: O timeout pode indicar que:');
            console.log('   - O Security Group do RDS não permite conexões do seu IP');
            console.log('   - O RDS não está configurado como "Publicly accessible"');
            console.log('   - Há um firewall bloqueando a porta 3306');
        } else if (err.code === 'ECONNREFUSED') {
            console.log('\n💡 Dica: Conexão recusada - verifique se a porta está correta');
        } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n💡 Dica: Credenciais incorretas - verifique usuário e senha');
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Conexão encerrada.');
        }
    }
}

testConnection().catch(console.error);

