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

module.exports = router;
