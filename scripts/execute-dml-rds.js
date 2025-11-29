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

async function executeDML() {
    let connection;

    try {
        console.log('🚀 Executando DML no MySQL 8.0 RDS...\n');

        const host = requireEnvVar('DB_HOST');
        const user = requireEnvVar('DB_USER');
        const password = requireEnvVar('DB_PASSWORD');
        const dbName = process.env.DB_NAME || 'dr_wallace';

        const config = {
            host,
            port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
            user,
            password,
            database: dbName, // Especifica o banco diretamente na conexão
            connectTimeout: 30000,
            multipleStatements: true, // Permite múltiplos statements
        };

        connection = await mysql.createConnection(config);
        console.log(`✅ Conectado ao servidor MySQL (banco: ${dbName})!\n`);

        // Verificar versão do MySQL
        const [versionRows] = await connection.execute('SELECT VERSION() as version');
        console.log(`📊 Versão do MySQL: ${versionRows[0].version}\n`);

        // Ler arquivo DML
        const dmlPath = path.join(__dirname, '..', 'sql', 'dml.sql');
        if (!fs.existsSync(dmlPath)) {
            throw new Error(`Arquivo não encontrado: ${dmlPath}`);
        }

        const dmlSQL = fs.readFileSync(dmlPath, 'utf8');
        console.log('📄 Arquivo dml.sql carregado\n');

        console.log('🔧 Executando DML (limpeza, inserção de dados, estatísticas)...\n');

        // Processar statements de forma robusta
        let cleanedSQL = dmlSQL
            .split('\n')
            .filter(line => {
                const trimmed = line.trim();
                if (trimmed.length === 0) return false;
                if (trimmed.startsWith('--') && !trimmed.includes('INSERT') && !trimmed.includes('UPDATE') && !trimmed.includes('DELETE') && !trimmed.includes('SELECT')) {
                    return false;
                }
                return true;
            })
            .join('\n');

        // Dividir em statements individuais
        const statements = [];
        let currentStatement = '';
        let inString = false;
        let stringChar = '';

        for (let i = 0; i < cleanedSQL.length; i++) {
            const char = cleanedSQL[i];

            // Detectar strings
            if ((char === '"' || char === "'" || char === '`') && (i === 0 || cleanedSQL[i - 1] !== '\\')) {
                if (!inString) {
                    inString = true;
                    stringChar = char;
                } else if (char === stringChar) {
                    inString = false;
                    stringChar = '';
                }
            }

            currentStatement += char;

            // Se encontrou ; e não está em string, finaliza statement
            if (char === ';' && !inString) {
                const stmt = currentStatement.trim();
                if (stmt.length > 0 && 
                    !stmt.toUpperCase().startsWith('USE ') &&
                    !stmt.toUpperCase().startsWith('CREATE DATABASE')) {
                    statements.push(stmt);
                }
                currentStatement = '';
            }
        }

        // Adicionar último statement se não terminou com ;
        if (currentStatement.trim().length > 0) {
            statements.push(currentStatement.trim());
        }

        console.log(`📝 Total de statements a executar: ${statements.length}\n`);

        // Executar cada statement
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            const stmtType = statement.trim().substring(0, 20).toUpperCase();

            // Pular SELECTs (são apenas para visualização)
            if (stmtType.startsWith('SELECT')) {
                continue;
            }

            try {
                await connection.query(statement); // Usar query para comandos SET, DELETE, INSERT, UPDATE
                
                // Log apenas para operações importantes
                if (stmtType.startsWith('DELETE FROM') || 
                    stmtType.startsWith('INSERT INTO') || 
                    stmtType.startsWith('UPDATE')) {
                    const tableName = statement.match(/(?:DELETE FROM|INSERT INTO|UPDATE)\s+(\w+)/i);
                    if (tableName) {
                        console.log(`   ✅ ${stmtType.split(' ')[0]}: ${tableName[1]}`);
                    }
                }
                successCount++;
            } catch (err) {
                // Ignorar erros de "table doesn't exist" na limpeza inicial
                if (err.code === 'ER_NO_SUCH_TABLE' && stmtType.startsWith('DELETE FROM')) {
                    console.log(`   ⚠️  Tabela não existe ainda (será criada): ${statement.match(/DELETE FROM\s+(\w+)/i)?.[1] || 'desconhecida'}`);
                    continue;
                }
                
                // Ignorar erros de "table doesn't exist" no ALTER TABLE
                if (err.code === 'ER_NO_SUCH_TABLE' && stmtType.startsWith('ALTER TABLE')) {
                    console.log(`   ⚠️  Tabela não existe ainda: ${statement.match(/ALTER TABLE\s+(\w+)/i)?.[1] || 'desconhecida'}`);
                    continue;
                }

                console.error(`   ❌ Erro no statement ${i + 1}:`);
                console.error(`   ${err.message}`);
                console.error(`   Statement: ${statement.substring(0, 100)}...`);
                errorCount++;
            }
        }

        console.log(`\n✅ DML executado!`);
        console.log(`   ✓ Statements executados com sucesso: ${successCount}`);
        if (errorCount > 0) {
            console.log(`   ⚠️  Erros: ${errorCount}`);
        }

        // Executar SELECTs finais para mostrar estatísticas
        console.log('\n📊 Executando consultas de estatísticas...\n');
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim().toUpperCase().startsWith('SELECT')) {
                try {
                    const [rows] = await connection.query(statement);
                    if (Array.isArray(rows) && rows.length > 0) {
                        // Se for o SELECT de resumo (primeiro SELECT)
                        if (statement.includes("'Pacientes' AS tabela")) {
                            console.log('=== RESUMO DOS DADOS INSERIDOS ===');
                            rows.forEach(row => {
                                const tabela = row.tabela || '';
                                const registros = row.registros !== undefined ? row.registros : '';
                                if (tabela && tabela !== '=== RESUMO DOS DADOS INSERIDOS ===') {
                                    console.log(`   ${tabela}: ${registros} registros`);
                                }
                            });
                        } else if (statement.includes('d.name AS medico')) {
                            console.log('\n=== MÉDIA DE AVALIAÇÕES POR MÉDICO ===');
                            rows.forEach(row => {
                                const medico = row.medico || 'N/A';
                                const total = row.total_avaliacoes || 0;
                                const media = row.media_estrelas || '0.00';
                                console.log(`   ${medico}: ${total} avaliações, média: ${media} ⭐`);
                            });
                        }
                    }
                } catch (err) {
                    // Ignorar erros em SELECTs
                }
            }
        }

        console.log('\n💡 Dados de exemplo inseridos com sucesso!');
        console.log('   - Pacientes: alice@example.com, bruno@example.com, carla@example.com (senha: teste)');
        console.log('   - Médicos: wallace@clinica.com, marina@clinica.com (senha: 112818WallaceVictor)');
        console.log('   - Consultas futuras e históricas criadas');
        console.log('   - Documentos, avaliações e notificações de exemplo inseridos');

    } catch (err) {
        console.error('\n❌ Erro ao executar DML:');
        console.error(err.message);
        if (err.code) {
            console.error(`Código do erro: ${err.code}`);
        }
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Conexão encerrada.');
        }
    }
}

executeDML().catch(console.error);

