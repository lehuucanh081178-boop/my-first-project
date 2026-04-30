const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'tarotlove_dev_secret_change_me';

function signToken(user) {
  return jwt.sign(
    { uid: user.uid, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
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

// PATCH /api/auth/me
router.patch('/me', [
  require('../middleware/auth').authMiddleware,
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Tên không hợp lệ'),
  body('phone').optional().trim().isLength({ max: 20 }).withMessage('Số điện thoại không hợp lệ'),
  body('password').optional().isLength({ min: 6, max: 128 }).withMessage('Mật khẩu tối thiểu 6 ký tự'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const updates = {};
    if (typeof req.body.name === 'string') updates.name = req.body.name.trim();
    if (typeof req.body.phone === 'string') updates.phone = req.body.phone.trim();
    if (typeof req.body.password === 'string' && req.body.password.trim()) {
      updates.password = await bcrypt.hash(req.body.password, 12);
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ success: false, message: 'Không có dữ liệu hợp lệ để cập nhật' });
    }

    await User.update(updates, { where: { uid: req.user.uid } });
    const user = await User.findByPk(req.user.uid, { attributes: { exclude: ['password'] } });
    const token = signToken(user);
    return res.json({ success: true, message: 'Cập nhật hồ sơ thành công', user, token });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
