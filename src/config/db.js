const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dr_wallace',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  connectTimeout: 10000, // 10 segundos
  acquireTimeout: 10000, // 10 segundos
  timeout: 10000, // 10 segundos
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test connection on startup
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connection established');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    console.error('💡 Verifique as variáveis de ambiente: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
    console.error('💡 Verifique se o RDS Security Group permite conexões do Railway');
  });

module.exports = pool;
