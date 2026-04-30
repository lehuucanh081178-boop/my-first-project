require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== SECURITY MIDDLEWARE =====
app.use(helmet({
  contentSecurityPolicy: false, // tắt để load CDN fonts/icons
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));

// Rate limiting — chống spam
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100,
  message: { success: false, message: 'Quá nhiều request, thử lại sau 15 phút' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Quá nhiều lần đăng nhập, thử lại sau' },
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// ===== BODY PARSING =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ===== LOGGING =====
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ===== STATIC FILES — serve frontend =====
app.use(express.static(path.join(__dirname, '../frontend')));
// Serve root index.html cũ nếu cần
app.use(express.static(path.join(__dirname, '..')));

// ===== API ROUTES =====
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/readers',  require('./routes/readers'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payment',  require('./routes/payment'));
app.use('/api/admin',    require('./routes/admin'));

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '🔮 TarotLove API đang chạy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ===== SPA FALLBACK — trả về frontend cho mọi route không phải API =====
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API endpoint không tồn tại' });
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ===== ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ success: false, message: 'Lỗi server nội bộ' });
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   🔮 TarotLove Server Running        ║
  ║   http://localhost:${PORT}              ║
  ║   API: http://localhost:${PORT}/api    ║
  ╚══════════════════════════════════════╝
  `);
});

module.exports = app;
