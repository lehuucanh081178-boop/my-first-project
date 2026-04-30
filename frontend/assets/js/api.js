// ===== API CLIENT — kết nối với backend =====
const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : '/api'; // production: cùng domain

// Helper gọi API
async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('tarot_token');
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json();
    if (!res.ok) throw { status: res.status, ...data };
    return data;
  } catch (err) {
    if (err.status === 401) {
      // Token hết hạn → logout
      localStorage.removeItem('tarot_token');
      localStorage.removeItem('tarot_user');
      window.dispatchEvent(new Event('auth:logout'));
    }
    throw err;
  }
}

// ===== AUTH API =====
const AuthAPI = {
  register: (data) => apiCall('/auth/register', { method: 'POST', body: data }),
  login:    (data) => apiCall('/auth/login',    { method: 'POST', body: data }),
  me:       ()     => apiCall('/auth/me'),
};

// ===== READERS API =====
const ReadersAPI = {
  getAll:   (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiCall(`/readers${q ? '?' + q : ''}`);
  },
  getOne:   (id)  => apiCall(`/readers/${id}`),
  review:   (id, data) => apiCall(`/readers/${id}/review`, { method: 'POST', body: data }),
};

// ===== BOOKINGS API =====
const BookingsAPI = {
  create:     (data) => apiCall('/bookings',       { method: 'POST', body: data }),
  myBookings: ()     => apiCall('/bookings/my'),
  updateStatus: (id, status) => apiCall(`/bookings/${id}/status`, { method: 'PATCH', body: { status } }),
};

// ===== PAYMENT API =====
const PaymentAPI = {
  momo: (bookingId) => apiCall('/payment/momo', { method: 'POST', body: { bookingId } }),
  bank: (bookingId) => apiCall('/payment/bank', { method: 'POST', body: { bookingId } }),
};

// ===== ADMIN API =====
const AdminAPI = {
  stats:   ()     => apiCall('/admin/stats'),
  users:   ()     => apiCall('/admin/users'),
  revenue: (days) => apiCall(`/admin/revenue?days=${days || 30}`),
  allBookings: (status) => apiCall(`/admin/bookings/all${status ? '?status=' + status : ''}`),
  updateUser: (id, data) => apiCall(`/admin/users/${id}`, { method: 'PATCH', body: data }),
  seed:    ()     => apiCall('/admin/seed', { method: 'POST' }),
};

// ===== AUTH STATE MANAGER =====
const Auth = {
  getUser: () => {
    try { return JSON.parse(localStorage.getItem('tarot_user')); } catch { return null; }
  },
  getToken: () => localStorage.getItem('tarot_token'),
  isLoggedIn: () => !!localStorage.getItem('tarot_token'),
  save: (token, user) => {
    localStorage.setItem('tarot_token', token);
    localStorage.setItem('tarot_user', JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('auth:login', { detail: user }));
  },
  logout: () => {
    localStorage.removeItem('tarot_token');
    localStorage.removeItem('tarot_user');
    window.dispatchEvent(new Event('auth:logout'));
  },
};
