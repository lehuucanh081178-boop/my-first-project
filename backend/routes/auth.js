const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../config/firebase');

// Helper tạo JWT
function signToken(user) {
  return jwt.sign(
    { uid: user.uid, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Tên không được để trống'),
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, password, phone } = req.body;

  try {
    const db = getDb();
    // Kiểm tra email đã tồn tại chưa
    const existing = await db.collection('users').where('email', '==', email).get();
    if (!existing.empty) {
      return res.status(409).json({ success: false, message: 'Email đã được sử dụng' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const uid = require('uuid').v4();

    const userData = {
      uid,
      name,
      email,
      phone: phone || '',
      password: hashedPassword,
      role: 'user',
      avatar: '',
      createdAt: new Date().toISOString(),
      totalBookings: 0,
      balance: 0,
    };

    await db.collection('users').doc(uid).set(userData);

    const token = signToken(userData);
    const { password: _, ...safeUser } = userData;

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công!',
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').notEmpty().withMessage('Mật khẩu không được để trống'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const db = getDb();
    const snapshot = await db.collection('users').where('email', '==', email).get();

    if (snapshot.empty) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    }

    const userData = snapshot.docs[0].data();
    const isMatch = await bcrypt.compare(password, userData.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    }

    const token = signToken(userData);
    const { password: _, ...safeUser } = userData;

    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// GET /api/auth/me — lấy thông tin user hiện tại
router.get('/me', require('../middleware/auth').authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('users').doc(req.user.uid).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
    }
    const { password: _, ...safeUser } = doc.data();
    res.json({ success: true, user: safeUser });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
