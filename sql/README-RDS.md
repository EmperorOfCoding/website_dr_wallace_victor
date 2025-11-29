# Como Executar o Schema no MySQL 8.0 RDS AWS

## ⚠️ IMPORTANTE: Se você está tendo erro de sintaxe

O erro "You have an error in your SQL syntax near 'CREATE TABLE'" geralmente acontece quando:
- O arquivo é executado como um único statement
- O cliente MySQL não processa múltiplos statements corretamente

**Solução**: Use o script Node.js abaixo (Opção 1) ou execute statement por statement.

## Opção 1: Via Script Node.js (RECOMENDADO - Resolve o problema)

```bash
# Configure as variáveis de ambiente
$env:DB_HOST="dr-wallace-mysql.cazs4008gdwb.us-east-1.rds.amazonaws.com"
$env:DB_USER="admin"
$env:DB_PASSWORD="sua-senha"
$env:DB_NAME="dr_wallace"

# Execute o script
node scripts/execute-schema-rds.js
```

## Opção 2: Via MySQL Workbench (Execute Statement por Statement)

1. Conecte-se ao RDS
2. Execute primeiro (se o banco não existir):
   ```sql
   CREATE DATABASE IF NOT EXISTS dr_wallace 
     CHARACTER SET utf8mb4 
     COLLATE utf8mb4_unicode_ci;
   ```
3. Selecione o banco `dr_wallace` no painel lateral
4. **IMPORTANTE**: Execute cada `CREATE TABLE` individualmente:
   - Selecione o primeiro `CREATE TABLE` até o `;`
   - Execute (F5 ou Ctrl+Enter)
   - Repita para cada tabela
5. Execute os triggers no final

**OU** use o arquivo `schema-rds-simple.sql` que tem menos comentários e pode funcionar melhor.

## Opção 3: Via mysql client (linha de comando)

```bash
mysql -h dr-wallace-mysql.cazs4008gdwb.us-east-1.rds.amazonaws.com \
      -u admin -p \
      dr_wallace < sql/schema-rds.sql
```

## Opção 4: Executar Statement por Statement

Se houver problemas, execute manualmente:

1. Conecte ao RDS
2. Execute: `USE dr_wallace;`
3. Execute cada `CREATE TABLE` individualmente
4. Execute os triggers no final

## Arquivos Disponíveis

- **`schema-rds-simple.sql`** - ⭐ Versão mais simples, menos comentários (RECOMENDADO para execução direta)
- **`schema-rds.sql`** - Versão otimizada para RDS (sem USE, sem DELIMITER)
- **`schema.sql`** - Versão completa (pode precisar de ajustes)

## Troubleshooting

### Erro: "You have an error in your SQL syntax near 'CREATE TABLE'"

**Causa**: O `USE dr_wallace;` pode estar causando problemas quando executado junto.

**Solução**: 
- Execute `USE dr_wallace;` separadamente antes de executar o schema
- Ou use o script `execute-schema-rds.js` que faz isso automaticamente

### Erro: "Table already exists"

**Causa**: As tabelas já foram criadas anteriormente.

**Solução**: 
- Use `DROP TABLE IF EXISTS` antes de criar (cuidado: apaga dados!)
- Ou ignore o erro (o `IF NOT EXISTS` já previne isso)

### Erro com Triggers

**Causa**: DELIMITER pode não funcionar em alguns clientes.

**Solução**: 
- Use `schema-rds.sql` que não tem DELIMITER
- Ou execute os triggers manualmente após criar as tabelas

