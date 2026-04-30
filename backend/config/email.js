const nodemailer = require('nodemailer');

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

async function sendBookingConfirmation(booking) {
  if (!process.env.EMAIL_USER) return; // skip nếu chưa config email

  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"TarotLove 🔮" <${process.env.EMAIL_USER}>`,
    to: booking.userEmail,
    subject: `✅ Xác nhận đặt lịch - ${booking.packageName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0a1e;color:#e2d9f3;padding:32px;border-radius:16px">
        <h1 style="color:#f59e0b;font-size:24px">🔮 TarotLove</h1>
        <h2 style="color:#fff">Đặt lịch thành công!</h2>
        <p>Xin chào <strong>${booking.userName}</strong>,</p>
        <p>Đơn đặt lịch của bạn đã được ghi nhận.</p>
        <div style="background:#1a1035;border:1px solid #7c3aed;border-radius:12px;padding:20px;margin:20px 0">
          <p><strong>Nhà Tarot:</strong> ${booking.readerName}</p>
          <p><strong>Gói dịch vụ:</strong> ${booking.packageName}</p>
          <p><strong>Chủ đề:</strong> ${booking.topic || 'Chưa chọn'}</p>
          <p><strong>Giá:</strong> <span style="color:#f59e0b;font-size:18px">${booking.price.toLocaleString()}đ</span></p>
          <p><strong>Mã đơn:</strong> <code style="color:#a78bfa">${booking.id.slice(0, 8).toUpperCase()}</code></p>
        </div>
        <p>Vui lòng thanh toán để xác nhận buổi xem. Chúng tôi sẽ liên hệ bạn sớm nhất.</p>
        <p style="color:#9d8ec4;font-size:12px">© 2024 TarotLove. Dịch vụ chỉ mang tính giải trí.</p>
      </div>
    `,
  });
}

async function sendWelcomeEmail(user) {
  if (!process.env.EMAIL_USER) return;
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"TarotLove 🔮" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: '🎉 Chào mừng bạn đến với TarotLove!',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0a1e;color:#e2d9f3;padding:32px;border-radius:16px">
        <h1 style="color:#f59e0b">🔮 TarotLove</h1>
        <h2 style="color:#fff">Chào mừng ${user.name}!</h2>
        <p>Tài khoản của bạn đã được tạo thành công.</p>
        <p>Hãy khám phá hàng trăm nhà tarot uy tín và tìm câu trả lời cho tình yêu của bạn.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
           style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#f59e0b);color:white;padding:12px 28px;border-radius:50px;text-decoration:none;font-weight:bold;margin-top:16px">
          Khám Phá Ngay →
        </a>
      </div>
    `,
  });
}

module.exports = { sendBookingConfirmation, sendWelcomeEmail };
