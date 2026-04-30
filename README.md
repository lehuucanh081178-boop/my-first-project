# 🔮 TarotLove — Nền tảng kết nối Tarot hàng đầu Việt Nam

TarotLove là ứng dụng web kết nối người dùng với các chuyên gia đọc bài Tarot. Người dùng có thể tìm kiếm reader, đặt lịch tư vấn, thanh toán trực tuyến và nhận kết quả qua email.

---

## 📁 Cấu trúc thư mục

```
tarotlove/
├── 📁 frontend/                    ← Giao diện người dùng
│   ├── index.html                  ← Trang chủ
│   ├── dashboard.html              ← Trang cá nhân user
│   ├── admin.html                  ← Trang quản trị
│   └── assets/
│       ├── css/
│       │   ├── style.css           ← CSS chính
│       │   ├── dashboard.css       ← CSS dashboard
│       │   └── admin.css           ← CSS admin
│       ├── js/
│       │   ├── api.js              ← Kết nối API
│       │   └── app.js              ← Logic trang chủ
│       └── img/                    ← Hình ảnh tĩnh
│
├── 📁 backend/                     ← Server Node.js + Express
│   ├── server.js                   ← Entry point
│   ├── 📁 config/
│   │   ├── db.js                   ← Kết nối SQL Server
│   │   ├── email.js                ← Cấu hình gửi email
│   │   └── database.sql            ← Schema SQL Server
│   ├── 📁 models/
│   │   └── index.js                ← Sequelize models
│   ├── 📁 routes/
│   │   ├── auth.js                 ← Đăng ký / Đăng nhập
│   │   ├── readers.js              ← Quản lý reader
│   │   ├── bookings.js             ← Đặt lịch
│   │   ├── payment.js              ← Thanh toán MoMo
│   │   └── admin.js                ← Admin API
│   └── 📁 middleware/
│       └── auth.js                 ← Xác thực JWT
│
├── .env                            ← Biến môi trường (không commit)
├── .env.example                    ← Mẫu biến môi trường
├── .gitignore
├── package.json
└── README.md
```

---

## ⚙️ Yêu cầu hệ thống

| Công cụ | Phiên bản tối thiểu |
|---|---|
| Node.js | v18+ |
| npm | v9+ |
| SQL Server | 2019+ (hoặc SQL Server Express) |
| Git | Bất kỳ |

---

## 🚀 Hướng dẫn cài đặt

### 1. Clone repository

```bash
git clone https://github.com/lehuucanh081178-boop/my-first-project.git
cd my-first-project
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình biến môi trường

Sao chép file mẫu và điền thông tin thực tế:

```bash
copy .env.example .env
```

Mở `.env` và cập nhật các giá trị:

```env
# SQL Server
DB_HOST=localhost
DB_PORT=1433
DB_NAME=TarotLoveDB
DB_USER=                    # Để trống nếu dùng Windows Authentication
DB_PASS=
DB_INSTANCE=                # Ví dụ: SQLEXPRESS (nếu dùng named instance)

# JWT
JWT_SECRET=your_secret_key_here

# Email (Gmail App Password)
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_16_char_app_password

# MoMo Sandbox
MOMO_PARTNER_CODE=MOMO
MOMO_ACCESS_KEY=your_access_key
MOMO_SECRET_KEY=your_secret_key

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3000
```

### 4. Tạo database

Mở SQL Server Management Studio (SSMS), kết nối vào server và chạy file schema:

```
backend/config/database.sql
```

---

## 🏃 Chạy ứng dụng

### Development (tự động reload khi sửa code)

```bash
npm run dev
```

### Production

```bash
npm start
```

Ứng dụng chạy tại: **http://localhost:3000**

| Trang | URL |
|---|---|
| Trang chủ | http://localhost:3000 |
| Dashboard | http://localhost:3000/dashboard.html |
| Admin | http://localhost:3000/admin.html |

---

## 📡 API Endpoints

Base URL: `http://localhost:3000/api`

### 🔐 Auth — `/api/auth`

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/auth/register` | Đăng ký tài khoản mới |
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/logout` | Đăng xuất |
| GET | `/api/auth/me` | Lấy thông tin user hiện tại |
| POST | `/api/auth/forgot-password` | Gửi email đặt lại mật khẩu |
| POST | `/api/auth/reset-password` | Đặt lại mật khẩu |

### 🔮 Readers — `/api/readers`

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/readers` | Danh sách tất cả reader |
| GET | `/api/readers/:id` | Chi tiết một reader |
| POST | `/api/readers` | Tạo hồ sơ reader (auth) |
| PUT | `/api/readers/:id` | Cập nhật hồ sơ reader (auth) |
| DELETE | `/api/readers/:id` | Xóa reader (admin) |

### 📅 Bookings — `/api/bookings`

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/bookings` | Danh sách lịch đặt của user |
| POST | `/api/bookings` | Tạo lịch đặt mới |
| GET | `/api/bookings/:id` | Chi tiết một booking |
| PUT | `/api/bookings/:id` | Cập nhật trạng thái booking |
| DELETE | `/api/bookings/:id` | Hủy booking |

### 💳 Payment — `/api/payment`

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/payment/momo` | Khởi tạo thanh toán MoMo |
| POST | `/api/payment/momo/callback` | Callback từ MoMo |
| GET | `/api/payment/status/:orderId` | Kiểm tra trạng thái thanh toán |

### 🛡️ Admin — `/api/admin`

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/admin/users` | Danh sách tất cả user |
| GET | `/api/admin/stats` | Thống kê tổng quan |
| PUT | `/api/admin/users/:id/status` | Khóa / mở khóa tài khoản |
| GET | `/api/admin/bookings` | Tất cả lịch đặt |

---

## 🗄️ Database

Dự án sử dụng **SQL Server** với ORM **Sequelize**.

- File schema: `backend/config/database.sql`
- Kết nối: `backend/config/db.js`
- Models: `backend/models/index.js`

### Kết nối Windows Authentication (khuyên dùng)

Để `DB_USER` và `DB_PASS` trống trong `.env`. Sequelize sẽ tự dùng Windows Authentication.

### Kết nối SQL Authentication

Điền `DB_USER` và `DB_PASS` vào `.env`.

---

## 🌐 Deploy

### Chuẩn bị

1. Đặt `NODE_ENV=production` trong `.env`
2. Cập nhật `FRONTEND_URL` và `BACKEND_URL` thành domain thực tế
3. Đảm bảo SQL Server production đã được cấu hình và chạy schema

### Deploy lên VPS / Server

```bash
# Cài Node.js và PM2
npm install -g pm2

# Clone và cài đặt
git clone https://github.com/lehuucanh081178-boop/my-first-project.git
cd my-first-project
npm install --production

# Cấu hình .env production
copy .env.example .env
# (chỉnh sửa .env với thông tin production)

# Chạy với PM2
pm2 start backend/server.js --name tarotlove
pm2 save
pm2 startup
```

### Kiểm tra logs

```bash
pm2 logs tarotlove
pm2 status
```

---

## 🤝 Đóng góp

1. Fork repository
2. Tạo branch mới: `git checkout -b feature/ten-tinh-nang`
3. Commit thay đổi: `git commit -m "feat: mô tả tính năng"`
4. Push lên branch: `git push origin feature/ten-tinh-nang`
5. Tạo Pull Request

---

## 📄 License

MIT © 2024 TarotLove Team
