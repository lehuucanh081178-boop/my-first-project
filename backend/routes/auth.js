const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { User } = require('../models');

function signToken(user) {
  return jwt.sign(
    { uid: user.uid, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET || 'tarotlove_secret_2024',
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
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  const { name, email, password, phone } = req.body;
  try {
    const existing = await User.findOne({ where: { email } });
    if (existing)
      return res.status(409).json({ success: false, message: 'Email đã được sử dụng' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      uid: uuidv4(), name, email, phone: phone || '',
      password: hashed, role: 'user',
    });

    const token = signToken(user);
    const { password: _, ...safe } = user.toJSON();
    res.status(201).json({ success: true, message: 'Đăng ký thành công!', token, user: safe });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email, isActive: true } });
    if (!user)
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });

    const token = signToken(user);
    const { password: _, ...safe } = user.toJSON();
    res.json({ success: true, message: 'Đăng nhập thành công!', token, user: safe });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth').authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.uid, {
      attributes: { exclude: ['password'] },
    });
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
