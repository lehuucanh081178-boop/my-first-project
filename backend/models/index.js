const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// ===== MODEL: User =====
const User = sequelize.define('User', {
  uid: {
    type: DataTypes.STRING(36), primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  name:     { type: DataTypes.STRING(100), allowNull: false },
  email:    { type: DataTypes.STRING(150), allowNull: false, unique: true },
  phone:    { type: DataTypes.STRING(20) },
  password: { type: DataTypes.STRING(255), allowNull: false },
  role:     { type: DataTypes.STRING(20), defaultValue: 'user' },
  avatar:   { type: DataTypes.STRING(500) },
  balance:  { type: DataTypes.INTEGER, defaultValue: 0 },
  totalBookings: { type: DataTypes.INTEGER, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'Users',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
});

// ===== MODEL: Reader =====
const Reader = sequelize.define('Reader', {
  id:       { type: DataTypes.STRING(36), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  name:     { type: DataTypes.STRING(100), allowNull: false },
  title:    { type: DataTypes.STRING(200), allowNull: false },
  img:      { type: DataTypes.STRING(500) },
  bio:      { type: DataTypes.TEXT },
  price:    { type: DataTypes.STRING(50), allowNull: false },
  priceNum: { type: DataTypes.INTEGER, allowNull: false },
  accuracy: { type: DataTypes.INTEGER, defaultValue: 90 },
  stars:    { type: DataTypes.DECIMAL(3, 1), defaultValue: 5.0 },
  reviews:  { type: DataTypes.INTEGER, defaultValue: 0 },
  sessions: { type: DataTypes.INTEGER, defaultValue: 0 },
  online:   { type: DataTypes.BOOLEAN, defaultValue: false },
  active:   { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'Readers',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
});

// ===== MODEL: ReaderCategory =====
const ReaderCategory = sequelize.define('ReaderCategory', {
  readerId: { type: DataTypes.STRING(36), primaryKey: true },
  category: { type: DataTypes.STRING(50), primaryKey: true },
}, { tableName: 'ReaderCategories', timestamps: false });

// ===== MODEL: ReaderTag =====
const ReaderTag = sequelize.define('ReaderTag', {
  readerId: { type: DataTypes.STRING(36), primaryKey: true },
  tag:      { type: DataTypes.STRING(100), primaryKey: true },
}, { tableName: 'ReaderTags', timestamps: false });

// ===== MODEL: Booking =====
const Booking = sequelize.define('Booking', {
  id:            { type: DataTypes.STRING(36), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  userId:        { type: DataTypes.STRING(36), allowNull: false },
  readerId:      { type: DataTypes.STRING(36), allowNull: false },
  packageType:   { type: DataTypes.STRING(20), allowNull: false },
  packageName:   { type: DataTypes.STRING(100), allowNull: false },
  price:         { type: DataTypes.INTEGER, allowNull: false },
  duration:      { type: DataTypes.INTEGER, allowNull: false },
  topic:         { type: DataTypes.STRING(200) },
  question:      { type: DataTypes.TEXT },
  scheduledAt:   { type: DataTypes.DATE },
  status:        { type: DataTypes.STRING(20), defaultValue: 'pending' },
  paymentStatus: { type: DataTypes.STRING(20), defaultValue: 'unpaid' },
  paymentMethod: { type: DataTypes.STRING(50) },
  transferCode:  { type: DataTypes.STRING(50) },
  momoOrderId:   { type: DataTypes.STRING(100) },
  paidAt:        { type: DataTypes.DATE },
  completedAt:   { type: DataTypes.DATE },
  cancelReason:  { type: DataTypes.STRING(500) },
}, {
  tableName: 'Bookings',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
});

// ===== MODEL: Review =====
const Review = sequelize.define('Review', {
  id:        { type: DataTypes.STRING(36), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  bookingId: { type: DataTypes.STRING(36), allowNull: false, unique: true },
  readerId:  { type: DataTypes.STRING(36), allowNull: false },
  userId:    { type: DataTypes.STRING(36), allowNull: false },
  stars:     { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
  comment:   { type: DataTypes.TEXT },
}, {
  tableName: 'Reviews',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: false,
});

// ===== MODEL: Payment =====
const Payment = sequelize.define('Payment', {
  id:            { type: DataTypes.STRING(36), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  bookingId:     { type: DataTypes.STRING(36), allowNull: false },
  userId:        { type: DataTypes.STRING(36), allowNull: false },
  amount:        { type: DataTypes.INTEGER, allowNull: false },
  method:        { type: DataTypes.STRING(50), allowNull: false },
  status:        { type: DataTypes.STRING(20), defaultValue: 'pending' },
  transactionId: { type: DataTypes.STRING(200) },
  rawResponse:   { type: DataTypes.TEXT },
}, {
  tableName: 'Payments',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: false,
});

// ===== MODEL: Notification =====
const Notification = sequelize.define('Notification', {
  id:       { type: DataTypes.STRING(36), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  userId:   { type: DataTypes.STRING(36), allowNull: false },
  title:    { type: DataTypes.STRING(200), allowNull: false },
  message:  { type: DataTypes.TEXT, allowNull: false },
  type:     { type: DataTypes.STRING(50), defaultValue: 'info' },
  isRead:   { type: DataTypes.BOOLEAN, defaultValue: false },
  link:     { type: DataTypes.STRING(500) },
}, {
  tableName: 'Notifications',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: false,
});

// ===== ASSOCIATIONS =====
Reader.hasMany(ReaderCategory, { foreignKey: 'readerId', as: 'categories' });
Reader.hasMany(ReaderTag,      { foreignKey: 'readerId', as: 'tags' });
ReaderCategory.belongsTo(Reader, { foreignKey: 'readerId' });
ReaderTag.belongsTo(Reader,      { foreignKey: 'readerId' });

User.hasMany(Booking,      { foreignKey: 'userId',   as: 'bookings' });
Reader.hasMany(Booking,    { foreignKey: 'readerId', as: 'bookings' });
Booking.belongsTo(User,   { foreignKey: 'userId',   as: 'user' });
Booking.belongsTo(Reader, { foreignKey: 'readerId', as: 'reader' });

Booking.hasOne(Review,  { foreignKey: 'bookingId', as: 'review' });
Review.belongsTo(Booking, { foreignKey: 'bookingId' });
Review.belongsTo(Reader,  { foreignKey: 'readerId', as: 'reader' });
Review.belongsTo(User,    { foreignKey: 'userId',   as: 'user' });

Booking.hasMany(Payment, { foreignKey: 'bookingId', as: 'payments' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });

module.exports = { User, Reader, ReaderCategory, ReaderTag, Booking, Review, Payment, Notification };
