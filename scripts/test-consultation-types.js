const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const pool = require('../src/config/db');

async function main() {
    try {
        console.log('🔍 Consultando tabela appointment_types...\n');

        const [rows] = await pool.execute(
            'SELECT id, name, duration_minutes, description, created_at FROM appointment_types ORDER BY created_at DESC'
        );

        if (rows.length === 0) {
            console.log('⚠️  Nenhum tipo de consulta encontrado na tabela.');
        } else {
            console.log(`✅ Encontrados ${rows.length} tipos de consulta:\n`);
            rows.forEach((row, index) => {
                console.log(`${index + 1}. ID: ${row.id}`);
                console.log(`   Nome: ${row.name}`);
                console.log(`   Duração: ${row.duration_minutes} minutos`);
                console.log(`   Descrição: ${row.description || '(sem descrição)'}`);
                console.log(`   Criado em: ${row.created_at}`);
                console.log('');
            });
        }
    } catch (err) {
        console.error('❌ Erro ao consultar tabela:', err.message);
        if (err.code === 'ER_NO_SUCH_TABLE') {
            console.error('💡 A tabela appointment_types não existe no banco de dados.');
            console.error('💡 Execute o script de migração para criar as tabelas.');
        }
    } finally {
        pool.end();
    }
}

main();
