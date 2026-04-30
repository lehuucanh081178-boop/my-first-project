const express = require('express');
const router = express.Router();
const { getDb } = require('../config/firebase');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { sendBookingConfirmation } = require('../config/email');

// POST /api/bookings — tạo đơn đặt lịch
router.post('/', authMiddleware, async (req, res) => {
  const { readerId, packageType, topic, question, scheduledAt } = req.body;

  if (!readerId || !packageType) {
    return res.status(400).json({ success: false, message: 'Thiếu thông tin đặt lịch' });
  }

  const PACKAGES = {
    basic:    { name: 'Gói Cơ Bản',   price: 50000,  duration: 15 },
    advanced: { name: 'Gói Nâng Cao', price: 120000, duration: 30 },
    vip:      { name: 'Gói VIP',      price: 250000, duration: 60 },
  };

  const pkg = PACKAGES[packageType];
  if (!pkg) return res.status(400).json({ success: false, message: 'Gói dịch vụ không hợp lệ' });

  try {
    const db = getDb();

    // Kiểm tra reader tồn tại
    const readerDoc = await db.collection('readers').doc(readerId).get();
    if (!readerDoc.exists) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy reader' });
    }

    const bookingId = require('uuid').v4();
    const booking = {
      id: bookingId,
      userId: req.user.uid,
      userName: req.user.name,
      userEmail: req.user.email,
      readerId,
      readerName: readerDoc.data().name,
      packageType,
      packageName: pkg.name,
      price: pkg.price,
      duration: pkg.duration,
      topic: topic || '',
      question: question || '',
      scheduledAt: scheduledAt || null,
      status: 'pending',        // pending → paid → confirmed → completed → cancelled
      paymentStatus: 'unpaid',  // unpaid → paid
      paymentMethod: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection('bookings').doc(bookingId).set(booking);

    // Gửi email xác nhận (không block response)
    sendBookingConfirmation(booking).catch(console.error);

    res.status(201).json({
      success: true,
      message: 'Đặt lịch thành công! Vui lòng thanh toán để xác nhận.',
      booking,
    });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// GET /api/bookings/my — lịch sử đặt của user
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const snap = await db.collection('bookings')
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();
    const bookings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// GET /api/bookings/all — tất cả đơn (admin)
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const { status, limit = 50 } = req.query;
    let query = db.collection('bookings').orderBy('createdAt', 'desc');
    if (status) query = query.where('status', '==', status);
    const snap = await query.limit(parseInt(limit)).get();
    const bookings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ success: true, bookings, total: bookings.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// PATCH /api/bookings/:id/status — cập nhật trạng thái (admin/reader)
router.patch('/:id/status', authMiddleware, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'paid', 'confirmed', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
  }

  try {
    const db = getDb();
    const doc = await db.collection('bookings').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });

    const booking = doc.data();
    // User chỉ được cancel đơn của mình
    if (req.user.role === 'user' && booking.userId !== req.user.uid) {
      return res.status(403).json({ success: false, message: 'Không có quyền' });
    }

    await db.collection('bookings').doc(req.params.id).update({
      status,
      updatedAt: new Date().toISOString(),
    });

    // Nếu completed → tăng sessions của reader
    if (status === 'completed') {
      await db.collection('readers').doc(booking.readerId).update({
        sessions: require('firebase-admin').firestore.FieldValue.increment(1),
      });
    }

    res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
