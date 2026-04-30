const { Sequelize } = require('sequelize');

// Kết nối MySQL thay vì SQL Server
const sequelize = new Sequelize({
  dialect: 'mysql',
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME     || 'TarotLoveDB',
  username: process.env.DB_USER     || 'root',
  password: process.env.DB_PASS     || '',
  logging: process.env.NODE_ENV === 'development'
    ? (sql) => console.log('\x1b[36m[SQL]\x1b[0m', sql.substring(0, 120))
    : false,
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
});

async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connected — TarotLoveDB');
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = { sequelize, connectDB };
