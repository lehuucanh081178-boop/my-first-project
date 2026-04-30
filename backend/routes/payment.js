const express  = require('express');
const router   = express.Router();
const crypto   = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { Booking, Payment, Reader } = require('../models');
const { authMiddleware } = require('../middleware/auth');

function safeEqual(a = '', b = '') {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

// ===== POST /api/payment/momo — tạo link thanh toán MoMo =====
router.post('/momo', authMiddleware, async (req, res) => {
  const { bookingId } = req.body;
  if (!bookingId)
    return res.status(400).json({ success: false, message: 'Thieu bookingId' });

  // Bat buoc env production
  const isProduction = process.env.NODE_ENV === 'production';
  const partnerCode = process.env.MOMO_PARTNER_CODE;
  const accessKey   = process.env.MOMO_ACCESS_KEY;
  const secretKey   = process.env.MOMO_SECRET_KEY;

  if (isProduction && (!partnerCode || !accessKey || !secretKey)) {
    console.error('FATAL: Thieu bien moi truong MoMo trong production!');
    return res.status(500).json({ success: false, message: 'Cau hinh thanh toan chua day du' });
  }

  // Sandbox fallback chi cho development
  const momoPartnerCode = partnerCode || 'MOMO';
  const momoAccessKey   = accessKey   || 'F8BBA842ECF85';
  const momoSecretKey   = secretKey   || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
  const momoEndpoint    = isProduction
    ? 'https://payment.momo.vn/v2/gateway/api/create'
    : 'https://test-payment.momo.vn/v2/gateway/api/create';

  try {
    const booking = await Booking.findOne({
      where: { id: bookingId, userId: req.user.uid },
      include: [{ model: Reader, as: 'reader', attributes: ['name'] }],
    });
    if (!booking)
      return res.status(404).json({ success: false, message: 'Khong tim thay don' });
    if (booking.paymentStatus === 'paid')
      return res.status(400).json({ success: false, message: 'Don nay da duoc thanh toan' });

    const orderId     = `TL_${bookingId.slice(0, 8)}_${Date.now()}`;
    const orderInfo   = `TarotLove - ${booking.packageName}`;
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/booking-success.html`;
    const ipnUrl      = `${process.env.BACKEND_URL  || 'http://localhost:3000'}/api/payment/momo/callback`;
    const amount      = booking.price.toString();
    const requestId   = orderId;
    const requestType = 'paymentCode';
    const extraData   = Buffer.from(JSON.stringify({ bookingId })).toString('base64');

    const rawSignature = [
      `accessKey=${momoAccessKey}`,
      `amount=${amount}`,
      `extraData=${extraData}`,
      `ipnUrl=${ipnUrl}`,
      `orderId=${orderId}`,
      `orderInfo=${orderInfo}`,
      `partnerCode=${momoPartnerCode}`,
      `redirectUrl=${redirectUrl}`,
      `requestId=${requestId}`,
      `requestType=${requestType}`,
    ].join('&');

    const signature = crypto.createHmac('sha256', momoSecretKey).update(rawSignature).digest('hex');

    const momoBody = {
      partnerCode: momoPartnerCode, accessKey: momoAccessKey,
      requestId, amount, orderId, orderInfo,
      redirectUrl, ipnUrl, extraData, requestType, signature, lang: 'vi',
    };

    const response = await fetch(momoEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(momoBody),
    });
    const data = await response.json();

    if (data.resultCode === 0) {
      await booking.update({ momoOrderId: orderId, paymentMethod: 'momo' });
      await Payment.create({
        id: uuidv4(), bookingId, userId: req.user.uid,
        amount: booking.price, method: 'momo', status: 'pending',
        transactionId: orderId,
      });
      res.json({ success: true, payUrl: data.payUrl, qrCodeUrl: data.qrCodeUrl });
    } else {
      res.status(400).json({ success: false, message: data.message || 'Loi tao thanh toan MoMo' });
    }
  } catch (err) {
    console.error('MoMo payment error:', err);
    res.status(500).json({ success: false, message: 'Loi server' });
  }
});

// ===== POST /api/payment/momo/callback — MoMo IPN =====
router.post('/momo/callback', async (req, res) => {
  const {
    partnerCode, orderId, requestId, amount,
    orderInfo, orderType, transId, resultCode,
    message, payType, responseTime, extraData, signature,
  } = req.body;

  try {
    // ===== XAC THUC CHU KY MoMo =====
    const secretKey = process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
    const accessKey = process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85';
    const rawSignature = [
      `accessKey=${accessKey}`,
      `amount=${amount}`,
      `extraData=${extraData}`,
      `message=${message}`,
      `orderId=${orderId}`,
      `orderInfo=${orderInfo}`,
      `orderType=${orderType}`,
      `partnerCode=${partnerCode}`,
      `payType=${payType}`,
      `requestId=${requestId}`,
      `responseTime=${responseTime}`,
      `resultCode=${resultCode}`,
      `transId=${transId}`,
    ].join('&');

    const expectedSig = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    if (!safeEqual(signature, expectedSig)) {
      console.error(`[MoMo IPN] Chu ky khong hop le! orderId=${orderId}`);
      return res.status(204).send();
    }

    const expectedPartnerCode = process.env.MOMO_PARTNER_CODE || 'MOMO';
    if (partnerCode !== expectedPartnerCode) {
      console.error(`[MoMo IPN] partnerCode khong khop! Expected=${expectedPartnerCode}, Got=${partnerCode}`);
      return res.status(204).send();
    }

    if (String(resultCode) !== '0') {
      console.log(`[MoMo IPN] Thanh toan that bai: orderId=${orderId}, code=${resultCode}`);
      await Payment.update(
        { status: 'failed', rawResponse: JSON.stringify(req.body) },
        { where: { transactionId: orderId, method: 'momo' } }
      );
      return res.status(204).send();
    }

    // ===== KIEM TRA orderId KHOP VOI DB =====
    const booking = await Booking.findOne({ where: { momoOrderId: orderId } });
    if (!booking) {
      console.error(`[MoMo IPN] Khong tim thay booking voi momoOrderId=${orderId}`);
      return res.status(204).send();
    }

    if (requestId !== booking.momoOrderId) {
      console.error(`[MoMo IPN] requestId khong khop! Expected=${booking.momoOrderId}, Got=${requestId}`);
      return res.status(204).send();
    }

    // ===== KIEM TRA SO TIEN =====
    if (Number(amount) !== booking.price) {
      console.error(`[MoMo IPN] So tien khong khop! Expected=${booking.price}, Got=${amount}`);
      return res.status(204).send();
    }

    // ===== CHONG REPLAY: da xu ly roi thi bo qua =====
    if (booking.paymentStatus === 'paid') {
      console.log(`[MoMo IPN] Booking ${booking.id} da duoc xu ly truoc do`);
      return res.status(204).send();
    }

    const payment = await Payment.findOne({
      where: { bookingId: booking.id, method: 'momo', transactionId: orderId },
    });
    if (!payment) {
      console.error(`[MoMo IPN] Khong tim thay payment pending cho orderId=${orderId}`);
      return res.status(204).send();
    }

    // ===== CAP NHAT DB =====
    await booking.update({
      status: 'paid',
      paymentStatus: 'paid',
      paidAt: new Date(),
    });
    await payment.update({
      status: 'success',
      transactionId: transId?.toString() || orderId,
      rawResponse: JSON.stringify(req.body),
    });

    console.log(`[MoMo IPN] Thanh toan thanh cong: booking=${booking.id}, transId=${transId}`);
    return res.status(204).send();
  } catch (err) {
    console.error('[MoMo IPN] Loi xu ly callback:', err);
    return res.status(500).send();
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
