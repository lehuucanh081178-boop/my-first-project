# TarotLove - Nen Tang Ket Noi Tarot

Web app ket noi nguoi dung voi cac chuyen gia doc bai Tarot. Dat lich tu van, thanh toan truc tuyen, quan ly don hang.

---

## Cau Truc Thu Muc

```
tarotlove/
├── frontend/
│   ├── index.html              Trang chu
│   ├── dashboard.html          Trang ca nhan user
│   ├── admin.html              Trang quan tri
│   ├── booking-success.html    Trang sau thanh toan
│   └── assets/
│       ├── css/
│       │   ├── style.css
│       │   ├── dashboard.css
│       │   └── admin.css
│       └── js/
│           ├── api.js          Ket noi API backend
│           └── app.js          Logic trang chu
│
├── backend/
│   ├── server.js               Entry point
│   ├── config/
│   │   ├── db.js               Ket noi SQL Server
│   │   ├── email.js            Gui email
│   │   └── database.sql        Schema + seed data
│   ├── models/
│   │   └── index.js            Sequelize models
│   ├── routes/
│   │   ├── auth.js             Dang ky / Dang nhap
│   │   ├── readers.js          Reader API
│   │   ├── bookings.js         Dat lich API
│   │   ├── payment.js          Thanh toan MoMo / Bank
│   │   └── admin.js            Admin API
│   └── middleware/
│       └── auth.js             Xac thuc JWT
│
├── .env                        Bien moi truong (khong commit)
├── .env.example                Mau bien moi truong
├── package.json
└── README.md
```

---

## Yeu Cau He Thong

| Cong cu     | Phien ban |
|-------------|-----------|
| Node.js     | v18+      |
| npm         | v9+       |
| SQL Server  | 2019+     |

---

## Cai Dat

### 1. Clone repo

```bash
git clone https://github.com/lehuucanh081178-boop/my-first-project.git
cd my-first-project
npm install
```

### 2. Tao file .env

```bash
copy .env.example .env
```

Chinh sua `.env` voi thong tin thuc te (xem phan ben duoi).

### 3. Tao database

Mo SSMS, ket noi vao SQL Server, chay file:

```
backend/config/database.sql
```

### 4. Chay server

```bash
# Development (tu dong reload)
npm run dev

# Production
npm start
```

Mo trinh duyet: **http://localhost:3000**

---

## Cau Hinh .env

```env
# SQL Server
DB_HOST=localhost
DB_PORT=1433
DB_NAME=TarotLoveDB
DB_USER=tarotlove_user
DB_PASS=mat_khau_cua_ban

# JWT - dat chuoi ngau nhien dai it nhat 32 ky tu
JWT_SECRET=thay_bang_chuoi_bi_mat_that_su_cua_ban

# Email Gmail (tao App Password tai myaccount.google.com/apppasswords)
EMAIL_USER=your@gmail.com
EMAIL_PASS=xxxx_xxxx_xxxx_xxxx

# MoMo (sandbox de test, thay bang production khi go-live)
MOMO_PARTNER_CODE=MOMO
MOMO_ACCESS_KEY=F8BBA842ECF85
MOMO_SECRET_KEY=K951B6PE1waDMi640xX08PD3vg6EkVlz

# Ngan hang nhan tien
BANK_NAME=Vietcombank
BANK_ACCOUNT=so_tai_khoan_cua_ban
BANK_OWNER=TEN_CHU_TAI_KHOAN

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3000
```

---

## API Endpoints

Base URL: `http://localhost:3000/api`

### Auth
| Method | Endpoint            | Mo ta                    |
|--------|---------------------|--------------------------|
| POST   | /auth/register      | Dang ky tai khoan        |
| POST   | /auth/login         | Dang nhap                |
| GET    | /auth/me            | Thong tin user hien tai  |

### Readers
| Method | Endpoint            | Mo ta                    |
|--------|---------------------|--------------------------|
| GET    | /readers            | Danh sach reader         |
| GET    | /readers/:id        | Chi tiet reader          |
| POST   | /readers/:id/review | Danh gia reader          |
| PATCH  | /readers/:id        | Cap nhat reader (admin)  |

### Bookings
| Method | Endpoint                  | Mo ta                    |
|--------|---------------------------|--------------------------|
| POST   | /bookings                 | Tao don dat lich         |
| GET    | /bookings/my              | Lich su dat cua user     |
| GET    | /bookings/all             | Tat ca don (admin)       |
| PATCH  | /bookings/:id/status      | Cap nhat trang thai      |
| GET    | /bookings/notifications   | Thong bao cua user       |

### Payment
| Method | Endpoint              | Mo ta                        |
|--------|-----------------------|------------------------------|
| POST   | /payment/momo         | Tao link thanh toan MoMo     |
| POST   | /payment/momo/callback| MoMo IPN callback            |
| POST   | /payment/bank         | Thong tin chuyen khoan       |
| POST   | /payment/confirm      | Admin xac nhan da nhan tien  |
| GET    | /payment/history      | Lich su thanh toan           |

### Admin
| Method | Endpoint              | Mo ta                    |
|--------|-----------------------|--------------------------|
| GET    | /admin/stats          | Thong ke tong quan       |
| GET    | /admin/users          | Danh sach users          |
| PATCH  | /admin/users/:id      | Cap nhat user            |
| GET    | /admin/revenue        | Doanh thu theo ngay      |
| GET    | /admin/bookings/all   | Tat ca don hang          |
| POST   | /admin/seed           | Seed du lieu mau         |

---

## Tao Tai Khoan Admin

Sau khi dang ky tai khoan binh thuong, chay lenh SQL nay trong SSMS:

```sql
USE TarotLoveDB;
UPDATE Users SET role = 'admin' WHERE email = 'email_cua_ban@gmail.com';
```

---

## Checklist Truoc Khi Deploy

- [ ] Doi `JWT_SECRET` thanh chuoi ngau nhien manh (32+ ky tu)
- [ ] Dien `EMAIL_USER` va `EMAIL_PASS` that
- [ ] Dien thong tin ngan hang that (`BANK_ACCOUNT`, `BANK_OWNER`)
- [ ] Dang ky MoMo Business de lay key production
- [ ] Dat `NODE_ENV=production`
- [ ] Cap nhat `FRONTEND_URL` va `BACKEND_URL` thanh domain that
- [ ] Cai HTTPS cho domain
- [ ] Tao tai khoan admin

---

## Deploy Len Server

```bash
# Cai PM2
npm install -g pm2

# Chay app
pm2 start backend/server.js --name tarotlove
pm2 save
pm2 startup

# Xem logs
pm2 logs tarotlove
pm2 status
```

---

## Luu Y Ve MoMo

MoMo callback (`/api/payment/momo/callback`) can URL HTTPS public de MoMo goi ve.
Khi chay local, dung **ngrok** de test:

```bash
# Cai ngrok
npm install -g ngrok

# Tao tunnel
ngrok http 3000

# Copy URL https://xxxx.ngrok.io vao .env
BACKEND_URL=https://xxxx.ngrok.io
```

---

## License

MIT - TarotLove 2024
