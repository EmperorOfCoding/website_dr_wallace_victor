const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

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

async function executeSchema() {
    const host = requireEnvVar('DB_HOST');
    const user = requireEnvVar('DB_USER');
    const password = requireEnvVar('DB_PASSWORD');
    const dbName = process.env.DB_NAME || 'dr_wallace';

    const config = {
        host,
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
        user,
        password,
        database: dbName, // Especificar database na conexão
        multipleStatements: true,
        connectTimeout: 30000,
    };

    console.log('🚀 Executando schema no MySQL 8.0 RDS...\n');

    let connection;
    try {
        // Conectar já especificando o database
        connection = await mysql.createConnection(config);
        console.log(`✅ Conectado ao servidor MySQL (banco: ${dbName})!\n`);

        // Verificar versão
        const [versionRows] = await connection.execute('SELECT VERSION() as version');
        const version = versionRows[0].version;
        console.log(`📊 Versão do MySQL: ${version}\n`);

        // Ler o arquivo schema (tenta versão simplificada primeiro)
        let schemaPath = path.join(__dirname, '..', 'sql', 'schema-rds-simple.sql');
        if (!fs.existsSync(schemaPath)) {
            console.log('💡 schema-rds-simple.sql não encontrado, tentando schema-rds.sql...');
            schemaPath = path.join(__dirname, '..', 'sql', 'schema-rds.sql');
            if (!fs.existsSync(schemaPath)) {
                console.log('💡 schema-rds.sql não encontrado, tentando schema.sql...');
                schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
                if (!fs.existsSync(schemaPath)) {
                    console.error(`❌ Nenhum arquivo de schema encontrado`);
                    process.exit(1);
                }
            }
        }

        let schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        console.log(`📄 Arquivo ${path.basename(schemaPath)} carregado\n`);

        // Remover comentários e linhas vazias, processar statements
        console.log('🔧 Executando schema (tabelas, índices, foreign keys, triggers)...\n');

        // Processar statements de forma mais robusta
        // Remove comentários de linha única, mas mantém estrutura
        let cleanedSQL = schemaSQL
            .split('\n')
            .filter(line => {
                const trimmed = line.trim();
                // Manter linhas vazias e linhas com código
                if (trimmed.length === 0) return false; // Remove linhas vazias
                if (trimmed.startsWith('--') && !trimmed.includes('CREATE')) return false; // Remove comentários
                return true;
            })
            .join('\n');

        // Dividir em statements individuais por ponto e vírgula
        // Considerando BEGIN...END blocks (para triggers)
        const statements = [];
        let currentStatement = '';
        let inString = false;
        let stringChar = '';
        let inBeginBlock = false;
        let beginDepth = 0;

        for (let i = 0; i < cleanedSQL.length; i++) {
            const char = cleanedSQL[i];
            const nextChars = cleanedSQL.substring(i, Math.min(i + 6, cleanedSQL.length)).toUpperCase();

            // Detectar strings (para não dividir em ; dentro de strings)
            if ((char === '"' || char === "'" || char === '`') && (i === 0 || cleanedSQL[i - 1] !== '\\')) {
                if (!inString) {
                    inString = true;
                    stringChar = char;
                } else if (char === stringChar) {
                    inString = false;
                    stringChar = '';
                }
            }

            // Detectar BEGIN (case insensitive)
            if (!inString && nextChars.startsWith('BEGIN')) {
                inBeginBlock = true;
                beginDepth++;
            }

            // Detectar END (case insensitive, mas precisa ser palavra completa)
            if (!inString && inBeginBlock && nextChars.startsWith('END')) {
                // Verificar se é realmente END (não ENDIF, etc)
                const endMatch = cleanedSQL.substring(i).match(/^END\s*[;]/i);
                if (endMatch) {
                    beginDepth--;
                    if (beginDepth === 0) {
                        inBeginBlock = false;
                    }
                }
            }

            currentStatement += char;

            // Se encontrou ; e não está em string nem em BEGIN block, finaliza statement
            if (char === ';' && !inString && !inBeginBlock) {
                const stmt = currentStatement.trim();
                if (stmt.length > 0 &&
                    !stmt.toUpperCase().startsWith('USE ') &&
                    !stmt.toUpperCase().startsWith('CREATE DATABASE') &&
                    !stmt.toUpperCase().startsWith('SELECT ') &&
                    !stmt.startsWith('--')) {
                    statements.push(stmt);
                }
                currentStatement = '';
            }
        }

        // Adicionar último statement se não terminou com ;
        if (currentStatement.trim().length > 0) {
            statements.push(currentStatement.trim());
        }

        // Executar cada statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.length < 10) continue;

            try {
                // Adicionar ponto e vírgula se não tiver
                const sql = statement.endsWith(';') ? statement : statement + ';';

                // DROP TRIGGER e CREATE TRIGGER não funcionam com prepared statements
                // Use query() para esses comandos
                if (sql.toUpperCase().includes('TRIGGER') ||
                    sql.toUpperCase().includes('DROP TRIGGER')) {
                    await connection.query(sql);
                } else {
                    await connection.execute(sql);
                }

                // Log de sucesso para tabelas e triggers
                if (statement.toUpperCase().startsWith('CREATE TABLE')) {
                    const tableName = statement.match(/CREATE TABLE.*?IF NOT EXISTS\s+`?(\w+)`?/i)?.[1] ||
                        statement.match(/CREATE TABLE.*?`?(\w+)`?/i)?.[1];
                    if (tableName) {
                        console.log(`   ✅ Tabela: ${tableName}`);
                    }
                } else if (statement.toUpperCase().includes('CREATE TRIGGER')) {
                    const triggerName = statement.match(/CREATE TRIGGER\s+(\w+)/i)?.[1];
                    if (triggerName) {
                        console.log(`   ✅ Trigger: ${triggerName}`);
                    }
                }
            } catch (err) {
                // Ignorar erros de "já existe" mas reportar outros
                if (err.code === 'ER_TABLE_EXISTS_ERROR' ||
                    err.code === 'ER_DB_CREATE_EXISTS' ||
                    err.code === 'ER_DUP_FIELDNAME' ||
                    err.code === 'ER_TRG_ALREADY_EXISTS') {
                    const name = err.message.match(/`(\w+)`/)?.[1] || 'objeto';
                    console.log(`   ⚠️  ${name} já existe, pulando...`);
                } else {
                    console.error(`   ❌ Erro: ${err.message}`);
                    console.error(`   Código: ${err.code}`);
                    console.error(`   Statement (primeiros 150 chars): ${statement.substring(0, 150)}...`);
                    throw err;
                }
            }
        }

        console.log('\n✅ Schema executado com sucesso!\n');
        console.log('💡 Próximos passos:');
        console.log('   - Execute o dml.sql para inserir dados iniciais (opcional)');
        console.log('   - Verifique as tabelas criadas');

    } catch (err) {
        console.error(`\n❌ Erro na execução: ${err.message}`);
        console.error(`   Código: ${err.code}`);
        if (err.sql) {
            console.error(`   SQL: ${err.sql.substring(0, 200)}...`);
        }
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Conexão encerrada.');
        }
    }
}

executeSchema().catch(console.error);

