const express = require('express');
const router = express.Router();
const { getDb } = require('../config/firebase');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// GET /api/readers — lấy danh sách reader (có filter)
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const { category, online, sort, limit = 20 } = req.query;

    let query = db.collection('readers').where('active', '==', true);

    if (category && category !== 'all') {
      query = query.where('categories', 'array-contains', category);
    }
    if (online === 'true') {
      query = query.where('online', '==', true);
    }

    const snapshot = await query.limit(parseInt(limit)).get();
    let readers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Sort phía client vì Firestore giới hạn compound query
    if (sort === 'rating') readers.sort((a, b) => b.stars - a.stars);
    if (sort === 'sessions') readers.sort((a, b) => b.sessions - a.sessions);
    if (sort === 'price_asc') readers.sort((a, b) => a.priceNum - b.priceNum);
    if (sort === 'price_desc') readers.sort((a, b) => b.priceNum - a.priceNum);

    res.json({ success: true, readers, total: readers.length });
  } catch (err) {
    console.error('Get readers error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// GET /api/readers/:id — chi tiết 1 reader
router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('readers').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy reader' });
    }

    // Lấy reviews của reader
    const reviewsSnap = await db.collection('reviews')
      .where('readerId', '==', req.params.id)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    const reviews = reviewsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    res.json({ success: true, reader: { id: doc.id, ...doc.data() }, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// POST /api/readers/:id/review — đánh giá reader (cần đăng nhập)
router.post('/:id/review', authMiddleware, async (req, res) => {
  const { stars, comment } = req.body;
  if (!stars || stars < 1 || stars > 5) {
    return res.status(400).json({ success: false, message: 'Số sao không hợp lệ (1-5)' });
  }

  try {
    const db = getDb();

    // Kiểm tra user đã booking reader này chưa
    const bookingSnap = await db.collection('bookings')
      .where('userId', '==', req.user.uid)
      .where('readerId', '==', req.params.id)
      .where('status', '==', 'completed')
      .get();

    if (bookingSnap.empty) {
      return res.status(403).json({ success: false, message: 'Bạn cần hoàn thành buổi xem trước khi đánh giá' });
    }

    const reviewId = require('uuid').v4();
    await db.collection('reviews').doc(reviewId).set({
      id: reviewId,
      readerId: req.params.id,
      userId: req.user.uid,
      userName: req.user.name,
      stars: parseInt(stars),
      comment: comment || '',
      createdAt: new Date().toISOString(),
    });

    // Cập nhật điểm trung bình reader
    const allReviews = await db.collection('reviews').where('readerId', '==', req.params.id).get();
    const avgStars = allReviews.docs.reduce((sum, d) => sum + d.data().stars, 0) / allReviews.size;
    await db.collection('readers').doc(req.params.id).update({
      stars: Math.round(avgStars * 10) / 10,
      reviews: allReviews.size,
    });

    res.status(201).json({ success: true, message: 'Đánh giá thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// POST /api/readers — thêm reader mới (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const id = require('uuid').v4();
    const readerData = {
      id,
      ...req.body,
      active: true,
      online: false,
      sessions: 0,
      stars: 5.0,
      reviews: 0,
      createdAt: new Date().toISOString(),
    };
    await db.collection('readers').doc(id).set(readerData);
    res.status(201).json({ success: true, reader: readerData });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// PATCH /api/readers/:id — cập nhật reader (admin only)
router.patch('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getDb();
    await db.collection('readers').doc(req.params.id).update({
      ...req.body,
      updatedAt: new Date().toISOString(),
    });
    res.json({ success: true, message: 'Cập nhật thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
