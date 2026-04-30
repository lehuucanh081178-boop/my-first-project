const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Booking, Reader, User, Notification } = require('../models');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { sendBookingConfirmation } = require('../config/email');

const PACKAGES = {
  basic:    { name: 'Gói Cơ Bản',   price: 50000,  duration: 15 },
  advanced: { name: 'Gói Nâng Cao', price: 120000, duration: 30 },
  vip:      { name: 'Gói VIP',      price: 250000, duration: 60 },
};

// POST /api/bookings — tạo đơn
router.post('/', authMiddleware, async (req, res) => {
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
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
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
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });
    res.json({ success: true, bookings: bookings.rows, total: bookings.count });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// PATCH /api/bookings/:id/status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  const { status, cancelReason } = req.body;
  const valid = ['pending', 'paid', 'confirmed', 'completed', 'cancelled'];
  if (!valid.includes(status))
    return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });

  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking)
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });

    if (req.user.role === 'user' && booking.userId !== req.user.uid)
      return res.status(403).json({ success: false, message: 'Không có quyền' });

    const updates = { status };
    if (status === 'completed') updates.completedAt = new Date();
    if (status === 'cancelled' && cancelReason) updates.cancelReason = cancelReason;

    await booking.update(updates);

    // Tăng sessions reader khi completed
    if (status === 'completed') {
      await Reader.increment('sessions', { where: { id: booking.readerId } });
    }

    res.json({ success: true, message: 'Cập nhật thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// GET /api/bookings/notifications — thông báo của user
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

module.exports = router;
