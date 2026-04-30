const express = require('express');
const router = express.Router();
const { getDb } = require('../config/firebase');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Tất cả routes admin đều cần auth + admin role
router.use(authMiddleware, adminMiddleware);

// GET /api/admin/stats — thống kê tổng quan
router.get('/stats', async (req, res) => {
  try {
    const db = getDb();
    const [usersSnap, readersSnap, bookingsSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('readers').get(),
      db.collection('bookings').get(),
    ]);

    const bookings = bookingsSnap.docs.map(d => d.data());
    const revenue = bookings
      .filter(b => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + (b.price || 0), 0);

    const today = new Date().toISOString().split('T')[0];
    const todayBookings = bookings.filter(b => b.createdAt?.startsWith(today));
    const todayRevenue = todayBookings
      .filter(b => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + (b.price || 0), 0);

    res.json({
      success: true,
      stats: {
        totalUsers: usersSnap.size,
        totalReaders: readersSnap.size,
        totalBookings: bookingsSnap.size,
        totalRevenue: revenue,
        todayBookings: todayBookings.length,
        todayRevenue,
        pendingBookings: bookings.filter(b => b.status === 'pending').length,
        completedBookings: bookings.filter(b => b.status === 'completed').length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// GET /api/admin/users — danh sách users
router.get('/users', async (req, res) => {
  try {
    const db = getDb();
    const snap = await db.collection('users').orderBy('createdAt', 'desc').get();
    const users = snap.docs.map(d => {
      const { password: _, ...u } = d.data();
      return u;
    });
    res.json({ success: true, users, total: users.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// PATCH /api/admin/users/:id — cập nhật user (ban/unban, đổi role)
router.patch('/users/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.collection('users').doc(req.params.id).update({
      ...req.body,
      updatedAt: new Date().toISOString(),
    });
    res.json({ success: true, message: 'Cập nhật thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// GET /api/admin/revenue — báo cáo doanh thu theo ngày
router.get('/revenue', async (req, res) => {
  try {
    const db = getDb();
    const { days = 30 } = req.query;
    const snap = await db.collection('bookings')
      .where('paymentStatus', '==', 'paid')
      .orderBy('paidAt', 'desc')
      .get();

    const bookings = snap.docs.map(d => d.data());
    const revenueByDay = {};

    bookings.forEach(b => {
      const day = b.paidAt?.split('T')[0];
      if (!day) return;
      if (!revenueByDay[day]) revenueByDay[day] = { date: day, revenue: 0, count: 0 };
      revenueByDay[day].revenue += b.price || 0;
      revenueByDay[day].count += 1;
    });

    const result = Object.values(revenueByDay)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, parseInt(days));

    res.json({ success: true, revenue: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// POST /api/admin/seed — seed dữ liệu reader mẫu (chỉ dùng lần đầu)
router.post('/seed', async (req, res) => {
  try {
    const db = getDb();
    const sampleReaders = [
      {
        id: 'reader-1', name: 'Luna Nguyệt', title: 'Chuyên gia Tarot Tình Yêu',
        img: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&h=300&fit=crop&crop=face',
        online: true, sessions: 2847, accuracy: 94, stars: 4.9, reviews: 312,
        price: '50.000đ / buổi', priceNum: 50000,
        tags: ['Tình yêu', 'Cặp đôi', 'Người cũ'],
        categories: ['love', 'couple', 'exback'],
        bio: 'Hơn 7 năm kinh nghiệm đọc tarot, chuyên sâu về tình yêu và các mối quan hệ.',
        active: true, createdAt: new Date().toISOString(),
      },
      {
        id: 'reader-2', name: 'Minh Tinh', title: 'Tarot Reader & Tư Vấn Tâm Lý',
        img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=face',
        online: true, sessions: 1923, accuracy: 91, stars: 4.8, reviews: 198,
        price: '60.000đ / buổi', priceNum: 60000,
        tags: ['Tương lai', 'Tình yêu', 'Sự nghiệp'],
        categories: ['love', 'future'],
        bio: '5 năm kinh nghiệm, kết hợp tarot với tâm lý học.',
        active: true, createdAt: new Date().toISOString(),
      },
      {
        id: 'reader-3', name: 'Hoa Đêm', title: 'Tarot Cổ Điển & Năng Lượng',
        img: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&h=300&fit=crop&crop=face',
        online: false, sessions: 3102, accuracy: 93, stars: 4.9, reviews: 445,
        price: '70.000đ / buổi', priceNum: 70000,
        tags: ['Người cũ', 'Cặp đôi', 'Tình yêu'],
        categories: ['exback', 'couple', 'love'],
        bio: 'Hơn 9 năm kinh nghiệm với bộ bài Rider-Waite cổ điển.',
        active: true, createdAt: new Date().toISOString(),
      },
      {
        id: 'reader-4', name: 'Huyền Bí', title: 'Tarot Huyền Học & Tâm Linh',
        img: 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=300&h=300&fit=crop&crop=face',
        online: false, sessions: 4231, accuracy: 95, stars: 5.0, reviews: 621,
        price: '100.000đ / buổi', priceNum: 100000,
        tags: ['Tất cả chủ đề', 'Tâm linh', 'Tương lai'],
        categories: ['love', 'couple', 'future', 'exback'],
        bio: 'Hơn 12 năm kinh nghiệm, reader uy tín nhất nền tảng.',
        active: true, createdAt: new Date().toISOString(),
      },
    ];

    const batch = db.batch();
    sampleReaders.forEach(r => {
      batch.set(db.collection('readers').doc(r.id), r);
    });
    await batch.commit();

    res.json({ success: true, message: `Đã seed ${sampleReaders.length} readers` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
