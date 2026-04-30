/**
 * TarotLove — Test API thu cong
 * Chay: node test-api.js
 * Dam bao server dang chay truoc: npm run dev
 */

const BASE = 'http://localhost:3000/api';
let token = '';
let bookingId = '';

async function req(method, path, body, auth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, data };
}

function pass(msg) { console.log(`  ✅ ${msg}`); }
function fail(msg) { console.log(`  ❌ ${msg}`); }
function section(msg) { console.log(`\n📋 ${msg}`); }

async function runTests() {
  console.log('🔮 TarotLove API Test\n' + '='.repeat(40));

  // ===== HEALTH =====
  section('Health Check');
  const health = await req('GET', '/health');
  health.data.success ? pass('Server dang chay') : fail('Server loi: ' + health.data.message);
  health.data.db === 'SQL Server Connected' ? pass('SQL Server ket noi OK') : fail('SQL Server loi');

  // ===== AUTH =====
  section('Auth — Dang ky & Dang nhap');
  const email = `test_${Date.now()}@tarotlove.vn`;

  const reg = await req('POST', '/auth/register', { name: 'Test User', email, password: '123456' });
  reg.status === 201 ? pass(`Dang ky thanh cong: ${email}`) : fail('Dang ky loi: ' + JSON.stringify(reg.data));

  const login = await req('POST', '/auth/login', { email, password: '123456' });
  if (login.status === 200 && login.data.token) {
    token = login.data.token;
    pass('Dang nhap thanh cong, co JWT token');
  } else {
    fail('Dang nhap loi: ' + JSON.stringify(login.data));
  }

  const me = await req('GET', '/auth/me', null, true);
  me.status === 200 ? pass(`GET /auth/me: ${me.data.user?.name}`) : fail('GET /auth/me loi');

  // ===== READERS =====
  section('Readers');
  const readers = await req('GET', '/readers');
  readers.status === 200 && readers.data.readers?.length > 0
    ? pass(`Lay duoc ${readers.data.readers.length} readers tu DB`)
    : fail('Khong lay duoc readers: ' + JSON.stringify(readers.data));

  const reader1 = await req('GET', '/readers/reader-1');
  reader1.status === 200
    ? pass(`Chi tiet reader: ${reader1.data.reader?.name}`)
    : fail('Khong lay duoc chi tiet reader');

  // ===== BOOKINGS =====
  section('Bookings');
  const booking = await req('POST', '/bookings', {
    readerId: 'reader-1',
    packageType: 'basic',
    topic: 'love',
    question: 'Test question',
  }, true);

  if (booking.status === 201 && booking.data.booking?.id) {
    bookingId = booking.data.booking.id;
    pass(`Dat lich thanh cong: ${bookingId.slice(0, 8)}...`);
  } else {
    fail('Dat lich loi: ' + JSON.stringify(booking.data));
  }

  const myBookings = await req('GET', '/bookings/my', null, true);
  myBookings.status === 200
    ? pass(`Lich su dat: ${myBookings.data.bookings?.length} don`)
    : fail('Khong lay duoc lich su');

  // ===== PAYMENT =====
  section('Payment');
  if (bookingId) {
    const bank = await req('POST', '/payment/bank', { bookingId }, true);
    bank.status === 200 && bank.data.bankInfo
      ? pass(`Thong tin chuyen khoan: ${bank.data.bankInfo.content}`)
      : fail('Loi lay thong tin ngan hang: ' + JSON.stringify(bank.data));

    const history = await req('GET', '/payment/history', null, true);
    history.status === 200
      ? pass(`Lich su thanh toan: ${history.data.payments?.length} giao dich`)
      : fail('Loi lich su thanh toan');
  }

  // ===== NOTIFICATIONS =====
  section('Notifications');
  const notifs = await req('GET', '/bookings/notifications', null, true);
  notifs.status === 200
    ? pass(`Thong bao: ${notifs.data.notifications?.length} tin`)
    : fail('Loi thong bao');

  // ===== SUMMARY =====
  console.log('\n' + '='.repeat(40));
  console.log('Test hoan tat!');
  console.log('Luu y: Admin API can tai khoan co role=admin de test.');
  console.log('MoMo callback can HTTPS public URL (dung ngrok khi test local).');
}

runTests().catch(err => {
  console.error('Loi chay test:', err.message);
  console.error('Dam bao server dang chay: npm run dev');
  process.exit(1);
});
