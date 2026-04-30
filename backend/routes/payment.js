const express = require('express');
const router = express.Router();
const { getDb } = require('../config/firebase');
const { authMiddleware } = require('../middleware/auth');
const crypto = require('crypto');

// ===== MOMO PAYMENT =====
// POST /api/payment/momo — tạo link thanh toán MoMo
router.post('/momo', authMiddleware, async (req, res) => {
  const { bookingId } = req.body;
  if (!bookingId) return res.status(400).json({ success: false, message: 'Thiếu bookingId' });

  try {
    const db = getDb();
    const doc = await db.collection('bookings').doc(bookingId).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });

    const booking = doc.data();
    if (booking.userId !== req.user.uid) {
      return res.status(403).json({ success: false, message: 'Không có quyền' });
    }

    // MoMo sandbox config
    const partnerCode = process.env.MOMO_PARTNER_CODE || 'MOMO';
    const accessKey   = process.env.MOMO_ACCESS_KEY   || 'F8BBA842ECF85';
    const secretKey   = process.env.MOMO_SECRET_KEY   || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
    const orderId     = `TAROT_${bookingId}_${Date.now()}`;
    const orderInfo   = `TarotLove - ${booking.packageName} với ${booking.readerName}`;
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/frontend/booking-success.html`;
    const ipnUrl      = `${process.env.BACKEND_URL  || 'http://localhost:3000'}/api/payment/momo/callback`;
    const amount      = booking.price.toString();
    const requestId   = orderId;
    const requestType = 'paymentCode';
    const extraData   = Buffer.from(JSON.stringify({ bookingId })).toString('base64');

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
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
      await db.collection('bookings').doc(bookingId).update({
        momoOrderId: orderId,
        paymentMethod: 'momo',
        updatedAt: new Date().toISOString(),
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

// POST /api/payment/momo/callback — MoMo gọi về sau khi thanh toán
router.post('/momo/callback', async (req, res) => {
  const { orderId, resultCode, extraData } = req.body;

  try {
    if (resultCode === 0) {
      // Thanh toán thành công
      const decoded = JSON.parse(Buffer.from(extraData, 'base64').toString());
      const { bookingId } = decoded;

      const db = getDb();
      await db.collection('bookings').doc(bookingId).update({
        status: 'paid',
        paymentStatus: 'paid',
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log(`✅ MoMo payment success: booking ${bookingId}`);
    }
    res.status(204).send();
  } catch (err) {
    console.error('MoMo callback error:', err);
    res.status(500).send();
  }
});

// POST /api/payment/bank — thanh toán chuyển khoản thủ công
router.post('/bank', authMiddleware, async (req, res) => {
  const { bookingId } = req.body;
  try {
    const db = getDb();
    const doc = await db.collection('bookings').doc(bookingId).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });

    const booking = doc.data();
    const transferCode = `TL${bookingId.slice(0, 8).toUpperCase()}`;

    await db.collection('bookings').doc(bookingId).update({
      paymentMethod: 'bank_transfer',
      transferCode,
      updatedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      bankInfo: {
        bankName: 'Vietcombank',
        accountNumber: '1234567890',
        accountName: 'CONG TY TAROTLOVE',
        amount: booking.price,
        content: transferCode,
        qrUrl: `https://img.vietqr.io/image/VCB-1234567890-compact2.png?amount=${booking.price}&addInfo=${transferCode}&accountName=TAROTLOVE`,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// POST /api/payment/confirm — admin xác nhận đã nhận tiền
router.post('/confirm', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Không có quyền' });
  const { bookingId } = req.body;
  try {
    const db = getDb();
    await db.collection('bookings').doc(bookingId).update({
      status: 'paid',
      paymentStatus: 'paid',
      paidAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    res.json({ success: true, message: 'Xác nhận thanh toán thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
