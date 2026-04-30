const express  = require('express');
const router   = express.Router();
const crypto   = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { Booking, Payment, Reader } = require('../models');
const { authMiddleware } = require('../middleware/auth');

// ===== POST /api/payment/momo — tạo link thanh toán MoMo =====
router.post('/momo', authMiddleware, async (req, res) => {
  const { bookingId } = req.body;
  if (!bookingId)
    return res.status(400).json({ success: false, message: 'Thiếu bookingId' });

  try {
    const booking = await Booking.findOne({
      where: { id: bookingId, userId: req.user.uid },
      include: [{ model: Reader, as: 'reader', attributes: ['name'] }],
    });
    if (!booking)
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });
    if (booking.paymentStatus === 'paid')
      return res.status(400).json({ success: false, message: 'Đơn này đã được thanh toán' });

    const partnerCode = process.env.MOMO_PARTNER_CODE || 'MOMO';
    const accessKey   = process.env.MOMO_ACCESS_KEY   || 'F8BBA842ECF85';
    const secretKey   = process.env.MOMO_SECRET_KEY   || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
    const orderId     = `TL_${bookingId.slice(0, 8)}_${Date.now()}`;
    const orderInfo   = `TarotLove - ${booking.packageName} voi ${booking.reader?.name || 'Reader'}`;
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/booking-success.html`;
    const ipnUrl      = `${process.env.BACKEND_URL  || 'http://localhost:3000'}/api/payment/momo/callback`;
    const amount      = booking.price.toString();
    const requestId   = orderId;
    const requestType = 'paymentCode';
    const extraData   = Buffer.from(JSON.stringify({ bookingId })).toString('base64');

    const rawSignature = [
      `accessKey=${accessKey}`,
      `amount=${amount}`,
      `extraData=${extraData}`,
      `ipnUrl=${ipnUrl}`,
      `orderId=${orderId}`,
      `orderInfo=${orderInfo}`,
      `partnerCode=${partnerCode}`,
      `redirectUrl=${redirectUrl}`,
      `requestId=${requestId}`,
      `requestType=${requestType}`,
    ].join('&');

    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    const momoBody = {
      partnerCode, accessKey, requestId, amount, orderId,
      orderInfo, redirectUrl, ipnUrl, extraData,
      requestType, signature, lang: 'vi',
    };

    const response = await fetch('https://test-payment.momo.vn/v2/gateway/api/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(momoBody),
    });
    const data = await response.json();

    if (data.resultCode === 0) {
      // Lưu orderId để đối chiếu callback
      await booking.update({ momoOrderId: orderId, paymentMethod: 'momo' });

      // Ghi lịch sử payment
      await Payment.create({
        id: uuidv4(), bookingId, userId: req.user.uid,
        amount: booking.price, method: 'momo', status: 'pending',
        transactionId: orderId,
      });

      res.json({ success: true, payUrl: data.payUrl, qrCodeUrl: data.qrCodeUrl });
    } else {
      res.status(400).json({ success: false, message: data.message || 'Lỗi tạo thanh toán MoMo' });
    }
  } catch (err) {
    console.error('MoMo payment error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// ===== POST /api/payment/momo/callback — MoMo IPN =====
router.post('/momo/callback', async (req, res) => {
  const { resultCode, extraData, transId } = req.body;
  try {
    if (resultCode === 0) {
      const decoded  = JSON.parse(Buffer.from(extraData, 'base64').toString());
      const { bookingId } = decoded;

      await Booking.update(
        { status: 'paid', paymentStatus: 'paid', paidAt: new Date() },
        { where: { id: bookingId } }
      );
      await Payment.update(
        { status: 'success', transactionId: transId?.toString() },
        { where: { bookingId, method: 'momo' } }
      );
      console.log(`✅ MoMo IPN success: booking ${bookingId}`);
    }
    res.status(204).send();
  } catch (err) {
    console.error('MoMo callback error:', err);
    res.status(500).send();
  }
});

// ===== POST /api/payment/bank — thông tin chuyển khoản =====
router.post('/bank', authMiddleware, async (req, res) => {
  const { bookingId } = req.body;
  try {
    const booking = await Booking.findOne({ where: { id: bookingId, userId: req.user.uid } });
    if (!booking)
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });

    const transferCode = `TL${bookingId.slice(0, 8).toUpperCase()}`;
    await booking.update({ paymentMethod: 'bank_transfer', transferCode });

    // Ghi lịch sử payment
    const existing = await Payment.findOne({ where: { bookingId, method: 'bank_transfer' } });
    if (!existing) {
      await Payment.create({
        id: uuidv4(), bookingId, userId: req.user.uid,
        amount: booking.price, method: 'bank_transfer', status: 'pending',
        transactionId: transferCode,
      });
    }

    const bankName      = process.env.BANK_NAME    || 'Vietcombank';
    const bankAccount   = process.env.BANK_ACCOUNT || '1234567890';
    const bankOwner     = process.env.BANK_OWNER   || 'CONG TY TAROTLOVE';

    res.json({
      success: true,
      bankInfo: {
        bankName, accountNumber: bankAccount, accountName: bankOwner,
        amount: booking.price, content: transferCode,
        qrUrl: `https://img.vietqr.io/image/VCB-${bankAccount}-compact2.png?amount=${booking.price}&addInfo=${transferCode}&accountName=${encodeURIComponent(bankOwner)}`,
      },
    });
  } catch (err) {
    console.error('Bank payment error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// ===== POST /api/payment/confirm — admin xác nhận đã nhận tiền =====
router.post('/confirm', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ success: false, message: 'Không có quyền' });

  const { bookingId } = req.body;
  try {
    const booking = await Booking.findByPk(bookingId);
    if (!booking)
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });

    await booking.update({ status: 'paid', paymentStatus: 'paid', paidAt: new Date() });
    await Payment.update(
      { status: 'success' },
      { where: { bookingId } }
    );
    res.json({ success: true, message: 'Xác nhận thanh toán thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// ===== GET /api/payment/history — lịch sử thanh toán của user =====
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const payments = await Payment.findAll({
      where: { userId: req.user.uid },
      order: [['createdAt', 'DESC']],
      limit: 20,
    });
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
