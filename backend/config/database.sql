-- ============================================
-- TarotLoveDB - Schema đầy đủ
-- SQL Server 2025
-- ============================================

USE TarotLoveDB;
GO

-- ===== BẢNG USERS =====
CREATE TABLE Users (
    uid         NVARCHAR(36)  PRIMARY KEY DEFAULT NEWID(),
    name        NVARCHAR(100) NOT NULL,
    email       NVARCHAR(150) NOT NULL UNIQUE,
    phone       NVARCHAR(20)  NULL,
    password    NVARCHAR(255) NOT NULL,
    role        NVARCHAR(20)  NOT NULL DEFAULT 'user',  -- user | reader | admin
    avatar      NVARCHAR(500) NULL,
    balance     INT           NOT NULL DEFAULT 0,
    totalBookings INT         NOT NULL DEFAULT 0,
    isActive    BIT           NOT NULL DEFAULT 1,
    createdAt   DATETIME2     NOT NULL DEFAULT GETDATE(),
    updatedAt   DATETIME2     NOT NULL DEFAULT GETDATE()
);
GO

-- ===== BẢNG READERS =====
CREATE TABLE Readers (
    id          NVARCHAR(36)  PRIMARY KEY DEFAULT NEWID(),
    name        NVARCHAR(100) NOT NULL,
    title       NVARCHAR(200) NOT NULL,
    img         NVARCHAR(500) NULL,
    bio         NVARCHAR(MAX) NULL,
    price       NVARCHAR(50)  NOT NULL,
    priceNum    INT           NOT NULL,
    accuracy    INT           NOT NULL DEFAULT 90,
    stars       DECIMAL(3,1)  NOT NULL DEFAULT 5.0,
    reviews     INT           NOT NULL DEFAULT 0,
    sessions    INT           NOT NULL DEFAULT 0,
    online      BIT           NOT NULL DEFAULT 0,
    active      BIT           NOT NULL DEFAULT 1,
    createdAt   DATETIME2     NOT NULL DEFAULT GETDATE(),
    updatedAt   DATETIME2     NOT NULL DEFAULT GETDATE()
);
GO

-- ===== BẢNG READER_CATEGORIES (many-to-many) =====
CREATE TABLE ReaderCategories (
    readerId    NVARCHAR(36)  NOT NULL,
    category    NVARCHAR(50)  NOT NULL,
    PRIMARY KEY (readerId, category),
    FOREIGN KEY (readerId) REFERENCES Readers(id) ON DELETE CASCADE
);
GO

-- ===== BẢNG READER_TAGS =====
CREATE TABLE ReaderTags (
    readerId    NVARCHAR(36)  NOT NULL,
    tag         NVARCHAR(100) NOT NULL,
    PRIMARY KEY (readerId, tag),
    FOREIGN KEY (readerId) REFERENCES Readers(id) ON DELETE CASCADE
);
GO

-- ===== BẢNG BOOKINGS =====
CREATE TABLE Bookings (
    id              NVARCHAR(36)  PRIMARY KEY DEFAULT NEWID(),
    userId          NVARCHAR(36)  NOT NULL,
    readerId        NVARCHAR(36)  NOT NULL,
    packageType     NVARCHAR(20)  NOT NULL,  -- basic | advanced | vip
    packageName     NVARCHAR(100) NOT NULL,
    price           INT           NOT NULL,
    duration        INT           NOT NULL,  -- phút
    topic           NVARCHAR(200) NULL,
    question        NVARCHAR(MAX) NULL,
    scheduledAt     DATETIME2     NULL,
    status          NVARCHAR(20)  NOT NULL DEFAULT 'pending',
    -- pending | paid | confirmed | completed | cancelled
    paymentStatus   NVARCHAR(20)  NOT NULL DEFAULT 'unpaid',
    -- unpaid | paid | refunded
    paymentMethod   NVARCHAR(50)  NULL,      -- momo | bank_transfer
    transferCode    NVARCHAR(50)  NULL,
    momoOrderId     NVARCHAR(100) NULL,
    paidAt          DATETIME2     NULL,
    completedAt     DATETIME2     NULL,
    cancelReason    NVARCHAR(500) NULL,
    createdAt       DATETIME2     NOT NULL DEFAULT GETDATE(),
    updatedAt       DATETIME2     NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (userId)   REFERENCES Users(uid),
    FOREIGN KEY (readerId) REFERENCES Readers(id)
);
GO

-- ===== BẢNG REVIEWS =====
CREATE TABLE Reviews (
    id          NVARCHAR(36)  PRIMARY KEY DEFAULT NEWID(),
    bookingId   NVARCHAR(36)  NOT NULL UNIQUE,  -- 1 booking = 1 review
    readerId    NVARCHAR(36)  NOT NULL,
    userId      NVARCHAR(36)  NOT NULL,
    stars       INT           NOT NULL CHECK (stars BETWEEN 1 AND 5),
    comment     NVARCHAR(MAX) NULL,
    createdAt   DATETIME2     NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (bookingId) REFERENCES Bookings(id),
    FOREIGN KEY (readerId)  REFERENCES Readers(id),
    FOREIGN KEY (userId)    REFERENCES Users(uid)
);
GO

-- ===== BẢNG PAYMENTS (lịch sử giao dịch) =====
CREATE TABLE Payments (
    id              NVARCHAR(36)  PRIMARY KEY DEFAULT NEWID(),
    bookingId       NVARCHAR(36)  NOT NULL,
    userId          NVARCHAR(36)  NOT NULL,
    amount          INT           NOT NULL,
    method          NVARCHAR(50)  NOT NULL,
    status          NVARCHAR(20)  NOT NULL DEFAULT 'pending',
    -- pending | success | failed | refunded
    transactionId   NVARCHAR(200) NULL,
    rawResponse     NVARCHAR(MAX) NULL,
    createdAt       DATETIME2     NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (bookingId) REFERENCES Bookings(id),
    FOREIGN KEY (userId)    REFERENCES Users(uid)
);
GO

-- ===== BẢNG NOTIFICATIONS =====
CREATE TABLE Notifications (
    id          NVARCHAR(36)  PRIMARY KEY DEFAULT NEWID(),
    userId      NVARCHAR(36)  NOT NULL,
    title       NVARCHAR(200) NOT NULL,
    message     NVARCHAR(MAX) NOT NULL,
    type        NVARCHAR(50)  NOT NULL DEFAULT 'info',
    -- info | success | warning | booking | payment
    isRead      BIT           NOT NULL DEFAULT 0,
    link        NVARCHAR(500) NULL,
    createdAt   DATETIME2     NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES Users(uid) ON DELETE CASCADE
);
GO

-- ===== INDEXES để tăng tốc query =====
CREATE INDEX IX_Bookings_UserId   ON Bookings(userId);
CREATE INDEX IX_Bookings_ReaderId ON Bookings(readerId);
CREATE INDEX IX_Bookings_Status   ON Bookings(status);
CREATE INDEX IX_Bookings_CreatedAt ON Bookings(createdAt DESC);
CREATE INDEX IX_Reviews_ReaderId  ON Reviews(readerId);
CREATE INDEX IX_Payments_BookingId ON Payments(bookingId);
CREATE INDEX IX_Notifications_UserId ON Notifications(userId);
GO

-- ===== SEED DỮ LIỆU MẪU =====

-- Seed Readers
INSERT INTO Readers (id, name, title, img, bio, price, priceNum, accuracy, stars, reviews, sessions, online, active)
VALUES
('reader-1', N'Luna Nguyệt', N'Chuyên gia Tarot Tình Yêu',
 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&h=300&fit=crop&crop=face',
 N'Hơn 7 năm kinh nghiệm đọc tarot, chuyên sâu về tình yêu và các mối quan hệ.',
 N'50.000đ / buổi', 50000, 94, 4.9, 312, 2847, 1, 1),

('reader-2', N'Minh Tinh', N'Tarot Reader & Tư Vấn Tâm Lý',
 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=face',
 N'5 năm kinh nghiệm, kết hợp tarot với tâm lý học.',
 N'60.000đ / buổi', 60000, 91, 4.8, 198, 1923, 1, 1),

('reader-3', N'Hoa Đêm', N'Tarot Cổ Điển & Năng Lượng',
 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&h=300&fit=crop&crop=face',
 N'Hơn 9 năm kinh nghiệm với bộ bài Rider-Waite cổ điển.',
 N'70.000đ / buổi', 70000, 93, 4.9, 445, 3102, 0, 1),

('reader-4', N'Huyền Bí', N'Tarot Huyền Học & Tâm Linh',
 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=300&h=300&fit=crop&crop=face',
 N'Hơn 12 năm kinh nghiệm, reader uy tín nhất nền tảng.',
 N'100.000đ / buổi', 100000, 95, 5.0, 621, 4231, 0, 1),

('reader-5', N'Sao Băng', N'Tarot Tình Yêu Chuyên Sâu',
 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=300&h=300&fit=crop&crop=face',
 N'3 năm kinh nghiệm, chuyên về tình yêu đơn phương.',
 N'45.000đ / buổi', 45000, 88, 4.6, 89, 987, 1, 1),

('reader-6', N'Thiên Bình', N'Tarot & Chiêm Tinh Học',
 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&h=300&fit=crop&crop=face',
 N'Kết hợp tarot với chiêm tinh học để đưa ra cái nhìn toàn diện.',
 N'55.000đ / buổi', 55000, 89, 4.7, 167, 1456, 1, 1);
GO

-- Seed Categories
INSERT INTO ReaderCategories VALUES
('reader-1','love'),('reader-1','couple'),('reader-1','exback'),
('reader-2','love'),('reader-2','future'),
('reader-3','exback'),('reader-3','couple'),('reader-3','love'),
('reader-4','love'),('reader-4','couple'),('reader-4','future'),('reader-4','exback'),
('reader-5','love'),('reader-5','couple'),
('reader-6','love'),('reader-6','future');
GO

-- Seed Tags
INSERT INTO ReaderTags VALUES
('reader-1',N'Tình yêu'),('reader-1',N'Cặp đôi'),('reader-1',N'Người cũ'),
('reader-2',N'Tương lai'),('reader-2',N'Tình yêu'),('reader-2',N'Sự nghiệp'),
('reader-3',N'Người cũ'),('reader-3',N'Cặp đôi'),('reader-3',N'Tình yêu'),
('reader-4',N'Tất cả chủ đề'),('reader-4',N'Tâm linh'),('reader-4',N'Tương lai'),
('reader-5',N'Tình yêu'),('reader-5',N'Đơn phương'),('reader-5',N'Cặp đôi'),
('reader-6',N'Tương lai'),('reader-6',N'Tình yêu'),('reader-6',N'Cung hoàng đạo');
GO

PRINT 'TarotLoveDB setup complete!';
GO
