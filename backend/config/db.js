const { Sequelize } = require('sequelize');

// Kết nối SQL Server — Windows Authentication
const sequelize = new Sequelize({
  dialect: 'mssql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME || 'TarotLoveDB',
  username: process.env.DB_USER || undefined,
  password: process.env.DB_PASS || undefined,
  dialectOptions: {
    options: {
      encrypt: false,
      trustServerCertificate: true,
      // Windows Authentication khi không có user/pas
      ...((!process.env.DB_USER) && {
        integratedSecurity: true,
        trustedConnection: true,
      }),
    },
  },
  logging: process.env.NODE_ENV === 'development'
    ? (sql) => console.log('\x1b[36m[SQL]\x1b[0m', sql.substring(0, 120))
    : false,
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
});

async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log('✅ SQL Server connected — TarotLoveDB');
  } catch (err) {
    console.error('❌ SQL Server connection failed:', err.message);
    console.error('   Kiểm tra lại DB_HOST, DB_NAME trong file .env');
    process.exit(1);
  }
}

module.exports = { sequelize, connectDB };
