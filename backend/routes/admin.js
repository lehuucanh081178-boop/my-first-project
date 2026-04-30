const express = require('express');
const router  = express.Router();
const { Op, fn, col, literal } = require('sequelize');
const { User, Reader, Booking, Payment, Review } = require('../models');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.use(authMiddleware, adminMiddleware);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, totalReaders, totalBookings, paidBookings, todayBookings, pendingCount, completedCount] =
      await Promise.all([
        User.count({ where: { role: 'user' } }),
        Reader.count({ where: { active: true } }),
        Booking.count(),
        Booking.findAll({ where: { paymentStatus: 'paid' }, attributes: ['price'] }),
        Booking.findAll({ where: { createdAt: { [Op.gte]: today } }, attributes: ['price', 'paymentStatus'] }),
        Booking.count({ where: { status: 'pending' } }),
        Booking.count({ where: { status: 'completed' } }),
      ]);

    const totalRevenue   = paidBookings.reduce((s, b) => s + b.price, 0);
    const todayRevenue   = todayBookings.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.price, 0);

    res.json({
      success: true,
      stats: {
        totalUsers, totalReaders, totalBookings,
        totalRevenue, todayBookings: todayBookings.length,
        todayRevenue, pendingBookings: pendingCount,
        completedBookings: completedCount,
      },
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { limit = 50, page = 1, search } = req.query;
    const where = search ? { [Op.or]: [
      { name:  { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ]} : {};

    const result = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });
    res.json({ success: true, users: result.rows, total: result.count });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// PATCH /api/admin/users/:id
router.patch('/users/:id', async (req, res) => {
  try {
    await User.update(req.body, { where: { uid: req.params.id } });
    res.json({ success: true, message: 'Cập nhật thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// GET /api/admin/revenue — doanh thu theo ngày (raw SQL cho hiệu quả)
router.get('/revenue', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const { sequelize } = require('../config/db');

    const rows = await sequelize.query(`
      SELECT
        CONVERT(DATE, paidAt) AS date,
        COUNT(*) AS [count],
        SUM(price) AS revenue
      FROM Bookings
      WHERE paymentStatus = 'paid'
        AND paidAt >= DATEADD(DAY, -${parseInt(days)}, GETDATE())
      GROUP BY CONVERT(DATE, paidAt)
      ORDER BY date DESC
    `, { type: sequelize.QueryTypes.SELECT });

    res.json({ success: true, revenue: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// GET /api/admin/bookings/all
router.get('/bookings/all', async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const where = status ? { status } : {};
    const result = await Booking.findAndCountAll({
      where,
      include: [
        { model: User,   as: 'user',   attributes: ['name', 'email'] },
        { model: Reader, as: 'reader', attributes: ['name'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });
    res.json({ success: true, bookings: result.rows, total: result.count });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// POST /api/admin/seed — seed lại readers mẫu (chỉ dùng khi DB trống)
router.post('/seed', async (req, res) => {
  try {
    const { Reader, ReaderCategory, ReaderTag } = require('../models');
    const { sequelize } = require('../config/db');

    const sampleReaders = [
      {
        id: 'reader-1', name: 'Luna Nguyệt', title: 'Chuyên gia Tarot Tình Yêu',
        img: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&h=300&fit=crop&crop=face',
        bio: 'Hơn 7 năm kinh nghiệm đọc tarot, chuyên sâu về tình yêu và các mối quan hệ.',
        price: '50.000đ / buổi', priceNum: 50000, accuracy: 94, stars: 4.9, reviews: 312, sessions: 2847, online: true, active: true,
        categories: ['love','couple','exback'], tags: ['Tình yêu','Cặp đôi','Người cũ'],
      },
      {
        id: 'reader-2', name: 'Minh Tinh', title: 'Tarot Reader & Tư Vấn Tâm Lý',
        img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=face',
        bio: '5 năm kinh nghiệm, kết hợp tarot với tâm lý học.',
        price: '60.000đ / buổi', priceNum: 60000, accuracy: 91, stars: 4.8, reviews: 198, sessions: 1923, online: true, active: true,
        categories: ['love','future'], tags: ['Tương lai','Tình yêu','Sự nghiệp'],
      },
      {
        id: 'reader-3', name: 'Hoa Đêm', title: 'Tarot Cổ Điển & Năng Lượng',
        img: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&h=300&fit=crop&crop=face',
        bio: 'Hơn 9 năm kinh nghiệm với bộ bài Rider-Waite cổ điển.',
        price: '70.000đ / buổi', priceNum: 70000, accuracy: 93, stars: 4.9, reviews: 445, sessions: 3102, online: false, active: true,
        categories: ['exback','couple','love'], tags: ['Người cũ','Cặp đôi','Tình yêu'],
      },
      {
        id: 'reader-4', name: 'Huyền Bí', title: 'Tarot Huyền Học & Tâm Linh',
        img: 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=300&h=300&fit=crop&crop=face',
        bio: 'Hơn 12 năm kinh nghiệm, reader uy tín nhất nền tảng.',
        price: '100.000đ / buổi', priceNum: 100000, accuracy: 95, stars: 5.0, reviews: 621, sessions: 4231, online: false, active: true,
        categories: ['love','couple','future','exback'], tags: ['Tất cả chủ đề','Tâm linh','Tương lai'],
      },
      {
        id: 'reader-5', name: 'Sao Băng', title: 'Tarot Tình Yêu Chuyên Sâu',
        img: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=300&h=300&fit=crop&crop=face',
        bio: '3 năm kinh nghiệm, chuyên về tình yêu đơn phương.',
        price: '45.000đ / buổi', priceNum: 45000, accuracy: 88, stars: 4.6, reviews: 89, sessions: 987, online: true, active: true,
        categories: ['love','couple'], tags: ['Tình yêu','Đơn phương','Cặp đôi'],
      },
      {
        id: 'reader-6', name: 'Thiên Bình', title: 'Tarot & Chiêm Tinh Học',
        img: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&h=300&fit=crop&crop=face',
        bio: 'Kết hợp tarot với chiêm tinh học để đưa ra cái nhìn toàn diện.',
        price: '55.000đ / buổi', priceNum: 55000, accuracy: 89, stars: 4.7, reviews: 167, sessions: 1456, online: true, active: true,
        categories: ['love','future'], tags: ['Tương lai','Tình yêu','Cung hoàng đạo'],
      },
    ];

    let created = 0;
    for (const r of sampleReaders) {
      const { categories, tags, ...readerData } = r;
      const [reader, isNew] = await Reader.findOrCreate({
        where: { id: readerData.id },
        defaults: readerData,
      });
      if (isNew) {
        await ReaderCategory.bulkCreate(categories.map(c => ({ readerId: r.id, category: c })), { ignoreDuplicates: true });
        await ReaderTag.bulkCreate(tags.map(t => ({ readerId: r.id, tag: t })), { ignoreDuplicates: true });
        created++;
      }
    }

    res.json({ success: true, message: `Seed hoàn tất: ${created} readers mới, ${sampleReaders.length - created} đã tồn tại` });
  } catch (err) {
    console.error('Seed error:', err);
    res.status(500).json({ success: false, message: 'Lỗi seed: ' + err.message });
  }
});

module.exports = router;
