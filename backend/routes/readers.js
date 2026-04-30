const express = require('express');
const router  = express.Router();
const { Op }  = require('sequelize');
const { body, query, param, validationResult } = require('express-validator');
const { Reader, ReaderCategory, ReaderTag, Review, User, Booking } = require('../models');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

function clampInt(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

// GET /api/readers — danh sách reader (filter + sort)
router.get('/', [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sort').optional().isIn(['rating', 'sessions', 'price_asc', 'price_desc']),
  query('search').optional().isLength({ max: 120 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    const { category, online, sort, limit = 20, search } = req.query;

    // Build where clause
    const where = { active: true };
    if (online === 'true') where.online = true;
    if (search) where.name = { [Op.like]: `%${search}%` };

    // Build order
    const orderMap = {
      rating:     [['stars', 'DESC']],
      sessions:   [['sessions', 'DESC']],
      price_asc:  [['priceNum', 'ASC']],
      price_desc: [['priceNum', 'DESC']],
    };
    const order = orderMap[sort] || [['sessions', 'DESC']];

    // Include categories & tags
    const include = [
      { model: ReaderCategory, as: 'categories', attributes: ['category'] },
      { model: ReaderTag,      as: 'tags',       attributes: ['tag'] },
    ];

    // Filter by category (join)
    if (category && category !== 'all') {
      include[0].where = { category };
      include[0].required = true;
    }

    const readers = await Reader.findAll({
      where, include, order,
      limit: clampInt(limit, 1, 100, 20),
    });

    // Format response — flatten categories/tags thành array
    const formatted = readers.map(r => {
      const obj = r.toJSON();
      obj.categories = obj.categories?.map(c => c.category) || [];
      obj.tags       = obj.tags?.map(t => t.tag) || [];
      return obj;
    });

    res.json({ success: true, readers: formatted, total: formatted.length });
  } catch (err) {
    console.error('Get readers error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// GET /api/readers/:id — chi tiết reader + reviews
router.get('/:id', async (req, res) => {
  try {
    const reader = await Reader.findByPk(req.params.id, {
      include: [
        { model: ReaderCategory, as: 'categories', attributes: ['category'] },
        { model: ReaderTag,      as: 'tags',       attributes: ['tag'] },
      ],
    });
    if (!reader)
      return res.status(404).json({ success: false, message: 'Không tìm thấy reader' });

    // Lấy 10 reviews mới nhất
    const reviews = await Review.findAll({
      where: { readerId: req.params.id },
      include: [{ model: User, as: 'user', attributes: ['name', 'avatar'] }],
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    const obj = reader.toJSON();
    obj.categories = obj.categories?.map(c => c.category) || [];
    obj.tags       = obj.tags?.map(t => t.tag) || [];

    res.json({ success: true, reader: obj, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// POST /api/readers/:id/review — đánh giá (cần đăng nhập + đã hoàn thành booking)
router.post('/:id/review', [
  authMiddleware,
  param('id').isLength({ min: 3, max: 64 }),
  body('bookingId').isLength({ min: 3, max: 64 }),
  body('stars').isInt({ min: 1, max: 5 }),
  body('comment').optional().isLength({ max: 2000 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  const { stars, comment, bookingId } = req.body;
  if (!stars || stars < 1 || stars > 5)
    return res.status(400).json({ success: false, message: 'Số sao không hợp lệ (1-5)' });

  try {
    // Kiểm tra booking hợp lệ
    const booking = await Booking.findOne({
      where: { id: bookingId, userId: req.user.uid, readerId: req.params.id, status: 'completed' },
    });
    if (!booking)
      return res.status(403).json({ success: false, message: 'Cần hoàn thành buổi xem trước khi đánh giá' });

    // Kiểm tra đã review chưa
    const existing = await Review.findOne({ where: { bookingId } });
    if (existing)
      return res.status(409).json({ success: false, message: 'Bạn đã đánh giá buổi xem này rồi' });

    await Review.create({
      id: uuidv4(), bookingId, readerId: req.params.id,
      userId: req.user.uid, stars: parseInt(stars), comment: comment || '',
    });

    // Cập nhật điểm trung bình reader
    const allReviews = await Review.findAll({ where: { readerId: req.params.id } });
    const avg = allReviews.reduce((s, r) => s + r.stars, 0) / allReviews.length;
    await Reader.update(
      { stars: Math.round(avg * 10) / 10, reviews: allReviews.length },
      { where: { id: req.params.id } }
    );

    res.status(201).json({ success: true, message: 'Đánh giá thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// POST /api/readers — thêm reader (admin)
router.post('/', [
  authMiddleware,
  adminMiddleware,
  body('name').isLength({ min: 1, max: 100 }),
  body('title').isLength({ min: 1, max: 200 }),
  body('price').isLength({ min: 1, max: 50 }),
  body('priceNum').isInt({ min: 10000, max: 100000000 }),
  body('img').optional().isLength({ max: 500 }),
  body('bio').optional().isLength({ max: 2000 }),
  body('accuracy').optional().isInt({ min: 50, max: 100 }),
  body('stars').optional().isFloat({ min: 1, max: 5 }),
  body('online').optional().isBoolean(),
  body('active').optional().isBoolean(),
  body('categories').optional().isArray({ max: 20 }),
  body('tags').optional().isArray({ max: 20 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    const { categories = [], tags = [], ...data } = req.body;
    const reader = await Reader.create({ id: uuidv4(), ...data });

    if (categories.length) {
      await ReaderCategory.bulkCreate(categories.map(c => ({ readerId: reader.id, category: c })));
    }
    if (tags.length) {
      await ReaderTag.bulkCreate(tags.map(t => ({ readerId: reader.id, tag: t })));
    }

    res.status(201).json({ success: true, reader });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// PATCH /api/readers/:id — cập nhật reader (admin)
router.patch('/:id', [
  authMiddleware,
  adminMiddleware,
  param('id').isLength({ min: 3, max: 64 }),
  body('name').optional().isLength({ min: 1, max: 100 }),
  body('title').optional().isLength({ min: 1, max: 200 }),
  body('img').optional().isLength({ max: 500 }),
  body('bio').optional().isLength({ max: 2000 }),
  body('price').optional().isLength({ min: 1, max: 50 }),
  body('priceNum').optional().isInt({ min: 10000, max: 100000000 }),
  body('accuracy').optional().isInt({ min: 50, max: 100 }),
  body('stars').optional().isFloat({ min: 1, max: 5 }),
  body('reviews').optional().isInt({ min: 0, max: 1000000 }),
  body('sessions').optional().isInt({ min: 0, max: 10000000 }),
  body('online').optional().isBoolean(),
  body('active').optional().isBoolean(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    const allowedFields = [
      'name', 'title', 'img', 'bio', 'price', 'priceNum',
      'accuracy', 'stars', 'reviews', 'sessions', 'online', 'active',
    ];
    const updates = Object.fromEntries(
      Object.entries(req.body || {}).filter(([key]) => allowedFields.includes(key))
    );
    if (!Object.keys(updates).length) {
      return res.status(400).json({ success: false, message: 'Khong co truong hop le de cap nhat' });
    }
    await Reader.update(updates, { where: { id: req.params.id } });
    res.json({ success: true, message: 'Cập nhật thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
