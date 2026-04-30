# 🔮 TarotLove — Hướng Dẫn Cài Đặt

## Yêu cầu
- Node.js 18+
- Tài khoản Firebase (miễn phí)

---

## Bước 1: Cài dependencies
```bash
npm install
```

## Bước 2: Tạo Firebase Project
1. Vào https://console.firebase.google.com
2. Tạo project mới → đặt tên "tarotlove"
3. Vào **Project Settings** → **Service Accounts**
4. Bấm **Generate new private key** → tải file JSON
5. Copy các giá trị vào file `.env`

## Bước 3: Tạo file .env
```bash
cp .env.example .env
```
Điền đầy đủ thông tin Firebase vào `.env`

## Bước 4: Bật Firestore
1. Trong Firebase Console → **Firestore Database**
2. Bấm **Create database** → chọn **Start in test mode**

## Bước 5: Chạy server
```bash
npm run dev
```
Mở http://localhost:3000

## Bước 6: Seed dữ liệu mẫu
1. Đăng ký tài khoản admin đầu tiên
2. Vào Firebase Console → Firestore → collection `users`
3. Tìm user vừa tạo → sửa field `role` thành `admin`
4. Vào http://localhost:3000/admin.html
5. Bấm **Seed Dữ Liệu Mẫu**

---

## Deploy lên Render.com (miễn phí)
1. Push code lên GitHub
2. Vào https://render.com → New Web Service
3. Kết nối GitHub repo
4. Build command: `npm install`
5. Start command: `npm start`
6. Thêm Environment Variables từ file `.env`
7. Deploy!

## Tên miền riêng
- Mua domain tại Namecheap (~$10/năm)
- Trỏ CNAME về Render domain
