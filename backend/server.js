require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const path       = require('path');
const { connectDB } = require('./config/db');

const app  = express();
const PORT = process.env.PORT || 3000;

// ===== SECURITY =====
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 200,
  message: { success: false, message: 'Quá nhiều request, thử lại sau' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  message: { success: false, message: 'Quá nhiều lần đăng nhập' },
});
app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// ===== BODY PARSING =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// ===== STATIC FILES =====
app.use(express.static(path.join(__dirname, '../frontend')));

// ===== API ROUTES =====
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/readers',  require('./routes/readers'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payment',  require('./routes/payment'));
app.use('/api/admin',    require('./routes/admin'));

// ===== HEALTH CHECK =====
app.get('/api/health', async (req, res) => {
  try {
    const { sequelize } = require('./config/db');
    await sequelize.authenticate();
    res.json({ success: true, message: '🔮 TarotLove API OK', db: 'SQL Server Connected', version: '2.0.0' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'DB connection failed' });
  }
});

// ===== SPA FALLBACK =====
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/'))
    return res.status(404).json({ success: false, message: 'API không tồn tại' });
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ===== ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ success: false, message: 'Lỗi server nội bộ' });
});

// ===== START =====
async function start() {
  await connectDB(); // kết nối SQL Server trước
  app.listen(PORT, () => {
    console.log(`
  ╔══════════════════════════════════════════╗
  ║   🔮 TarotLove v2.0 — SQL Server         ║
  ║   http://localhost:${PORT}                  ║
  ║   Admin: http://localhost:${PORT}/admin.html║
  ╚══════════════════════════════════════════╝
    `);
  });
}

start();
module.exports = app;
