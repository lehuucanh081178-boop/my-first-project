const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const { body, query, param, validationResult } = require('express-validator');
const { Booking, Reader, User, Notification } = require('../models');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { sendBookingConfirmation } = require('../config/email');

const PACKAGES = {
  basic:    { name: 'Gói Cơ Bản',   price: 50000,  duration: 15 },
  advanced: { name: 'Gói Nâng Cao', price: 120000, duration: 30 },
  vip:      { name: 'Gói VIP',      price: 250000, duration: 60 },
};

function clampInt(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

// POST /api/bookings — tạo đơn
router.post('/', [
  authMiddleware,
  body('readerId').isLength({ min: 3, max: 64 }),
  body('packageType').isIn(['basic', 'advanced', 'vip']),
  body('topic').optional().isLength({ max: 200 }),
  body('question').optional().isLength({ max: 4000 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  const { readerId, packageType, topic, question, scheduledAt } = req.body;
  if (!readerId || !packageType)
    return res.status(400).json({ success: false, message: 'Thiếu thông tin đặt lịch' });

  const pkg = PACKAGES[packageType];
  if (!pkg)
    return res.status(400).json({ success: false, message: 'Gói dịch vụ không hợp lệ' });

  try {
    const reader = await Reader.findByPk(readerId);
    if (!reader)
      return res.status(404).json({ success: false, message: 'Không tìm thấy reader' });

    const booking = await Booking.create({
      id: uuidv4(),
      userId: req.user.uid,
      readerId,
      packageType,
      packageName: pkg.name,
      price: pkg.price,
      duration: pkg.duration,
      topic: topic || '',
      question: question || '',
      scheduledAt: scheduledAt || null,
      status: 'pending',
      paymentStatus: 'unpaid',
    });

    // Tạo notification cho user
    await Notification.create({
      id: uuidv4(),
      userId: req.user.uid,
      title: '📅 Đặt lịch thành công',
      message: `Bạn đã đặt lịch với ${reader.name} — ${pkg.name}. Vui lòng thanh toán để xác nhận.`,
      type: 'booking',
      link: '/dashboard.html#bookings',
    });

    // Cập nhật totalBookings của user
    await User.increment('totalBookings', { where: { uid: req.user.uid } });

    // Gửi email (không block)
    sendBookingConfirmation({
      ...booking.toJSON(),
      readerName: reader.name,
      userName: req.user.name,
      userEmail: req.user.email,
    }).catch(console.error);

    res.status(201).json({
      success: true,
      message: 'Đặt lịch thành công! Vui lòng thanh toán để xác nhận.',
      booking: { ...booking.toJSON(), readerName: reader.name },
    });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// GET /api/bookings/my — lịch sử của user
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { userId: req.user.uid },
      include: [{ model: Reader, as: 'reader', attributes: ['name', 'img', 'title'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// GET /api/bookings/all — tất cả đơn (admin)
router.get('/all', [
  authMiddleware,
  adminMiddleware,
  query('status').optional().isIn(['pending', 'paid', 'confirmed', 'completed', 'cancelled']),
  query('limit').optional().isInt({ min: 1, max: 200 }),
  query('page').optional().isInt({ min: 1, max: 10000 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const where = status ? { status } : {};
    const bookings = await Booking.findAndCountAll({
      where,
      include: [
        { model: User,   as: 'user',   attributes: ['name', 'email', 'phone'] },
        { model: Reader, as: 'reader', attributes: ['name', 'img'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: clampInt(limit, 1, 200, 50),
      offset: (clampInt(page, 1, 10000, 1) - 1) * clampInt(limit, 1, 200, 50),
    });
    res.json({ success: true, bookings: bookings.rows, total: bookings.count });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// PATCH /api/bookings/:id/status
router.patch('/:id/status', [
  authMiddleware,
  param('id').isLength({ min: 3, max: 64 }),
  body('status').isIn(['pending', 'paid', 'confirmed', 'completed', 'cancelled']),
  body('cancelReason').optional().isLength({ max: 500 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  const { status, cancelReason } = req.body;

  // Trạng thái hợp lệ theo từng role
  const USER_ALLOWED  = ['cancelled'];          // user chỉ được hủy đơn của mình
  const isAdmin = req.user.role === 'admin';
  const isReader = req.user.role === 'reader';
  const allowed = isAdmin
    ? ['pending', 'paid', 'confirmed', 'completed', 'cancelled']
    : isReader
      ? ['confirmed', 'completed', 'cancelled']
      : USER_ALLOWED;

  if (!allowed.includes(status)) {
    return res.status(403).json({
      success: false,
      message: isAdmin
        ? 'Trang thai khong hop le'
        : 'Ban chi co the huy don cua minh',
    });
  }

  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking)
      return res.status(404).json({ success: false, message: 'Khong tim thay don' });

    // User chi duoc thao tac tren don cua chinh minh
    if (!isAdmin && !isReader && booking.userId !== req.user.uid)
      return res.status(403).json({ success: false, message: 'Khong co quyen' });

    if (isReader) {
      return res.status(403).json({
        success: false,
        message: 'Tai khoan reader chua duoc gan ho so reader de xu ly don',
      });
    }

    // Khong cho huy don da hoan thanh hoac da huy
    if (['completed', 'cancelled'].includes(booking.status))
      return res.status(400).json({ success: false, message: `Don da o trang thai "${booking.status}", khong the thay doi` });

    const updates = { status };
    if (status === 'completed') updates.completedAt = new Date();
    if (status === 'cancelled' && cancelReason) updates.cancelReason = cancelReason;

    await booking.update(updates);

    // Tang sessions reader khi completed
    if (status === 'completed') {
      await Reader.increment('sessions', { where: { id: booking.readerId } });
    }

    res.json({ success: true, message: 'Cap nhat thanh cong' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Loi server' });
  }
});

// GET /api/bookings/notifications — thông báo của user
// ĐẶT TRƯỚC /:id để tránh Express match "notifications" như một :id
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const notifs = await Notification.findAll({
      where: { userId: req.user.uid },
      order: [['createdAt', 'DESC']],
      limit: 20,
    });
    res.json({ success: true, notifications: notifs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// GET /api/bookings/:id — chi tiết 1 booking
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      where: { id: req.params.id },
      include: [
        { model: Reader, as: 'reader', attributes: ['name', 'img', 'title'] },
        { model: User,   as: 'user',   attributes: ['name', 'email'] },
      ],
    });
    if (!booking)
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });
    // User chỉ xem đơn của mình, admin xem tất cả
    if (req.user.role === 'user' && booking.userId !== req.user.uid)
      return res.status(403).json({ success: false, message: 'Không có quyền' });
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
