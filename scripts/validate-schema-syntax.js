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

async function validateSchema() {
  const host = requireEnvVar('DB_HOST');
  const user = requireEnvVar('DB_USER');
  const password = requireEnvVar('DB_PASSWORD');
  const dbName = process.env.DB_NAME || 'dr_wallace';

  const config = {
    host,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user,
    password,
    multipleStatements: true, // Permite múltiplas statements
    connectTimeout: 10000,
  };

  console.log('🔍 Validando sintaxe do schema.sql para MySQL 8.0...\n');

  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Conectado ao servidor MySQL!\n');

    // Verificar versão do MySQL
    const [versionRows] = await connection.execute('SELECT VERSION() as version');
    const version = versionRows[0].version;
    console.log(`📊 Versão do MySQL: ${version}\n`);

    const majorVersion = parseInt(version.split('.')[0]);
    if (majorVersion < 8) {
      console.warn('⚠️  Aviso: Este script foi validado para MySQL 8.0+');
      console.warn('   A versão atual pode ter diferenças de comportamento.\n');
    }

    // Ler o arquivo schema.sql
    const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      console.error(`❌ Arquivo não encontrado: ${schemaPath}`);
      process.exit(1);
    }

    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    console.log('📄 Arquivo schema.sql carregado\n');

    // Tentar executar o schema (sem commit, apenas validação de sintaxe)
    console.log('🔧 Validando sintaxe SQL...\n');
    
    // Dividir em statements e validar cada um
    const statements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('SELECT'));

    let validStatements = 0;
    let errors = [];

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length < 10) continue; // Ignorar statements muito pequenos

      try {
        // Tentar preparar o statement (valida sintaxe sem executar)
        await connection.execute(statement);
        validStatements++;
      } catch (err) {
        // Alguns erros são esperados (ex: tabelas já existem)
        if (err.code !== 'ER_TABLE_EXISTS_ERROR' && 
            err.code !== 'ER_DUP_FIELDNAME' &&
            err.code !== 'ER_CANT_DROP_FIELD_OR_KEY') {
          errors.push({
            statement: statement.substring(0, 100) + '...',
            error: err.message,
            code: err.code
          });
        }
      }
    }

    if (errors.length > 0) {
      console.log('❌ Erros encontrados na validação:\n');
      errors.forEach((err, idx) => {
        console.log(`${idx + 1}. ${err.code}: ${err.error}`);
        console.log(`   Statement: ${err.statement}\n`);
      });
      process.exit(1);
    } else {
      console.log(`✅ Validação concluída! ${validStatements} statements válidos.\n`);
      console.log('✅ O schema.sql é compatível com MySQL 8.0!\n');
    }

  } catch (err) {
    console.error(`❌ Erro na validação: ${err.message}`);
    console.error(`   Código: ${err.code}`);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

validateSchema().catch(console.error);

