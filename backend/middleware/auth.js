const jwt = require('jsonwebtoken');

// Xác thực JWT token
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ success: false, message: 'Không có token xác thực' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
}

// Chỉ cho admin
function adminMiddleware(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
  }
  next();
}

// Chỉ cho reader
function readerMiddleware(req, res, next) {
  if (req.user?.role !== 'reader' && req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Chỉ dành cho Reader' });
  }
  next();
}

module.exports = { authMiddleware, adminMiddleware, readerMiddleware };
