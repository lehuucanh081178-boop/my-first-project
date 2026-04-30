// ===== DỮ LIỆU READER =====
const readers = [
  {
    id: 1,
    name: "Luna Nguyệt",
    title: "Chuyên gia Tarot Tình Yêu",
    avatar: "🌙",
    // Ảnh chân dung cô gái huyền bí — AI-style portrait từ Unsplash
    img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&h=300&fit=crop&crop=face",
    online: true,
    sessions: 2847,
    accuracy: 94,
    stars: 4.9,
    reviews: 312,
    price: "50.000đ / buổi",
    priceNum: 50000,
    tags: ["Tình yêu", "Cặp đôi", "Người cũ"],
    category: ["love", "couple", "exback"],
    bio: "Hơn 7 năm kinh nghiệm đọc tarot, chuyên sâu về tình yêu và các mối quan hệ. Luna đã giúp hàng nghìn bạn trẻ tìm lại sự bình yên trong tình cảm. Phong cách đọc nhẹ nhàng, tâm lý và rất chi tiết.",
    miniReviews: [
      "Chị xem chuẩn lắm, nói đúng y chang tình huống của em 😭",
      "Rất tâm lý, giải thích rõ ràng từng lá bài",
      "Đã xem 3 lần rồi, lần nào cũng chuẩn!"
    ]
  },
  {
    id: 2,
    name: "Minh Tinh",
    title: "Tarot Reader & Tư Vấn Tâm Lý",
    avatar: "⭐",
    img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=face",
    online: true,
    sessions: 1923,
    accuracy: 91,
    stars: 4.8,
    reviews: 198,
    price: "60.000đ / buổi",
    priceNum: 60000,
    tags: ["Tương lai", "Tình yêu", "Sự nghiệp"],
    category: ["love", "future"],
    bio: "5 năm kinh nghiệm, kết hợp tarot với tâm lý học để đưa ra những phân tích sâu sắc nhất. Minh Tinh nổi tiếng với khả năng đọc năng lượng và cảm nhận tình huống rất chính xác.",
    miniReviews: [
      "Chị phân tích rất logic, không nói chung chung",
      "Xem xong thấy nhẹ lòng hẳn, cảm ơn chị nhiều!",
      "Đặt lịch dễ, xem đúng giờ, rất chuyên nghiệp"
    ]
  },
  {
    id: 3,
    name: "Hoa Đêm",
    title: "Tarot Cổ Điển & Năng Lượng",
    avatar: "🌸",
    img: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&h=300&fit=crop&crop=face",
    online: false,
    sessions: 3102,
    accuracy: 93,
    stars: 4.9,
    reviews: 445,
    price: "70.000đ / buổi",
    priceNum: 70000,
    tags: ["Người cũ", "Cặp đôi", "Tình yêu"],
    category: ["exback", "couple", "love"],
    bio: "Hơn 9 năm kinh nghiệm với bộ bài Rider-Waite cổ điển. Hoa Đêm được biết đến với khả năng cảm nhận năng lượng đặc biệt, đặc biệt giỏi trong các vấn đề về người cũ và mối quan hệ phức tạp.",
    miniReviews: [
      "Chị nói đúng 100% về người cũ của em, không tin nổi!",
      "Xem rất chi tiết, giải thích từng lá bài rõ ràng",
      "Đã giới thiệu cho 5 người bạn rồi, ai cũng khen"
    ]
  },
  {
    id: 4,
    name: "Thiên Bình",
    title: "Tarot & Chiêm Tinh Học",
    avatar: "⚖️",
    img: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&h=300&fit=crop&crop=face",
    online: true,
    sessions: 1456,
    accuracy: 89,
    stars: 4.7,
    reviews: 167,
    price: "55.000đ / buổi",
    priceNum: 55000,
    tags: ["Tương lai", "Tình yêu", "Cung hoàng đạo"],
    category: ["love", "future"],
    bio: "Kết hợp tarot với chiêm tinh học để đưa ra cái nhìn toàn diện nhất. Thiên Bình chuyên phân tích sự tương hợp giữa các cung hoàng đạo và dự đoán xu hướng tình cảm trong tương lai.",
    miniReviews: [
      "Phân tích cung hoàng đạo rất hay, học được nhiều thứ",
      "Xem chuẩn, tư vấn thực tế không nói viển vông",
      "Giá hợp lý, chất lượng tốt!"
    ]
  },
  {
    id: 5,
    name: "Sao Băng",
    title: "Tarot Tình Yêu Chuyên Sâu",
    avatar: "💫",
    img: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=300&h=300&fit=crop&crop=face",
    online: true,
    sessions: 987,
    accuracy: 88,
    stars: 4.6,
    reviews: 89,
    price: "45.000đ / buổi",
    priceNum: 45000,
    tags: ["Tình yêu", "Đơn phương", "Cặp đôi"],
    category: ["love", "couple"],
    bio: "3 năm kinh nghiệm, chuyên về tình yêu đơn phương và các mối quan hệ mới bắt đầu. Sao Băng nổi tiếng với phong cách xem thân thiện, dễ hiểu, phù hợp với các bạn trẻ.",
    miniReviews: [
      "Chị xem dễ hiểu lắm, không dùng từ khó",
      "Lần đầu xem tarot mà không thấy sợ, chị giải thích rất tốt",
      "Đúng với tình huống của mình, cảm ơn chị!"
    ]
  },
  {
    id: 6,
    name: "Huyền Bí",
    title: "Tarot Huyền Học & Tâm Linh",
    avatar: "🔮",
    img: "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=300&h=300&fit=crop&crop=face",
    online: false,
    sessions: 4231,
    accuracy: 95,
    stars: 5.0,
    reviews: 621,
    price: "100.000đ / buổi",
    priceNum: 100000,
    tags: ["Tất cả chủ đề", "Tâm linh", "Tương lai"],
    category: ["love", "couple", "future", "exback"],
    bio: "Hơn 12 năm kinh nghiệm, là một trong những reader uy tín nhất nền tảng. Huyền Bí có khả năng cảm nhận năng lượng đặc biệt và đã giúp hàng nghìn người tìm lại hướng đi trong cuộc sống và tình yêu.",
    miniReviews: [
      "Xem xong như được khai sáng, chuẩn đến từng chi tiết nhỏ",
      "Đây là reader giỏi nhất mình từng gặp!",
      "Đặt lịch khó vì quá đông khách nhưng xứng đáng chờ"
    ]
  }
];

let currentCategory = 'all';

// ===== RENDER READERS =====
function renderReaders(category = 'all') {
  const grid = document.getElementById('readersGrid');
  const filtered = category === 'all'
    ? readers
    : readers.filter(r => r.category.includes(category));

  grid.innerHTML = filtered.map(r => `
    <div class="reader-card" onclick="openReaderDetail(${r.id})" data-category="${r.category.join(' ')}">
      <!-- Ảnh chân dung ma mị -->
      <div class="reader-img-wrap">
        <img class="reader-img" src="${r.img}" alt="${r.name}" loading="lazy"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
        <div class="reader-img-fallback" style="display:none">${r.avatar}</div>
        <div class="reader-img-overlay"></div>
        <div class="reader-img-glow"></div>
        ${r.online
          ? '<div class="online-dot-img"><span></span>Online</div>'
          : '<div class="busy-dot-img">Đang bận</div>'
        }
        <div class="reader-img-particles" id="particles-${r.id}"></div>
      </div>
      <div class="reader-body">
        <div class="reader-name-row">
          <h3>${r.name}</h3>
          <span class="reader-avatar-icon">${r.avatar}</span>
        </div>
        <div class="reader-title">${r.title}</div>
        <div class="reader-stats">
          <div class="r-stat">
            <span class="r-stat-val">${r.sessions.toLocaleString()}</span>
            <span class="r-stat-label">Lượt xem</span>
          </div>
          <div class="r-stat">
            <span class="r-stat-val">${r.accuracy}%</span>
            <span class="r-stat-label">Độ chính xác</span>
          </div>
          <div class="r-stat">
            <span class="r-stat-val">${r.stars}</span>
            <span class="r-stat-label">Sao</span>
          </div>
        </div>
        <div class="reader-tags">
          ${r.tags.map(t => `<span class="tag">${t}</span>`).join('')}
        </div>
        <div class="reader-stars">${renderStars(r.stars)} <span style="color:var(--text-muted);font-size:.8rem">(${r.reviews})</span></div>
        <div class="reader-price">
          <span class="price-tag">${r.price}</span>
          <button class="btn-book" onclick="event.stopPropagation(); bookReader(${r.id})">
            ${r.online ? '⚡ Đặt Ngay' : '📅 Đặt Lịch'}
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let stars = '';
  for (let i = 0; i < full; i++) stars += '⭐';
  if (half) stars += '✨';
  return stars;
}

// ===== FILTER CATEGORY =====
function filterCategory(cat, btn) {
  currentCategory = cat;
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderReaders(cat);
}

// ===== READER DETAIL =====
function openReaderDetail(id) {
  const r = readers.find(x => x.id === id);
  if (!r) return;

  document.getElementById('readerModalContent').innerHTML = `
    <div class="reader-detail-header">
      <div class="reader-detail-img-wrap">
        <img src="${r.img}" alt="${r.name}" class="reader-detail-img"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
        <div class="reader-detail-avatar" style="display:none">${r.avatar}</div>
        <div class="reader-detail-img-glow"></div>
      </div>
      <div class="reader-detail-info">
        <h2>${r.name} <span style="font-size:1.4rem">${r.avatar}</span></h2>
        <div class="reader-title" style="color:var(--gold); margin-bottom:8px">${r.title}</div>
        ${r.online
          ? '<div class="online-badge">🟢 Đang online — Có thể đặt ngay</div>'
          : '<div class="busy-badge">🔴 Đang bận — Đặt lịch trước</div>'
        }
        <div class="reader-stars" style="margin-top:8px">${renderStars(r.stars)} (${r.reviews} đánh giá)</div>
      </div>
    </div>
    <div class="reader-detail-stats">
      <div class="reader-detail-stat">
        <span class="val">${r.sessions.toLocaleString()}</span>
        <span class="lbl">Tổng lượt xem</span>
      </div>
      <div class="reader-detail-stat">
        <span class="val">${r.accuracy}%</span>
        <span class="lbl">Độ chính xác</span>
      </div>
      <div class="reader-detail-stat">
        <span class="val">${r.stars} ⭐</span>
        <span class="lbl">${r.reviews} đánh giá</span>
      </div>
    </div>
    <div class="reader-tags" style="margin-bottom:16px">
      ${r.tags.map(t => `<span class="tag">${t}</span>`).join('')}
    </div>
    <p class="reader-bio">${r.bio}</p>
    <div class="reader-reviews-mini">
      <h4>💬 Khách hàng nói về ${r.name}:</h4>
      ${r.miniReviews.map(rv => `<div class="mini-review">"${rv}"</div>`).join('')}
    </div>
    <div style="display:flex; align-items:center; justify-content:space-between; margin-top:16px; padding-top:16px; border-top:1px solid var(--border)">
      <span style="font-size:1.2rem; font-weight:700; color:var(--gold)">${r.price}</span>
      <button class="btn-book" style="padding:12px 28px; font-size:1rem"
        onclick="bookReader(${r.id})">
        ${r.online ? '⚡ Đặt Ngay' : '📅 Đặt Lịch Trước'}
      </button>
    </div>
  `;
  openModal('readerModal');
}

function bookReader(id) {
  const r = readers.find(x => x.id === id);
  closeModal('readerModal');
  openModal('bookingModal');
  showToast(`Đang đặt lịch với ${r.name} 🔮`);
}

// ===== MODAL =====
function openModal(id) {
  document.getElementById(id).classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
  document.body.style.overflow = '';
}

function switchModal(from, to) {
  closeModal(from);
  setTimeout(() => openModal(to), 150);
}

// Đóng modal khi click ngoài
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', function(e) {
    if (e.target === this) {
      this.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
});

// ===== FORM SUBMIT =====
function submitBooking(e) {
  e.preventDefault();
  closeModal('bookingModal');
  showToast('✅ Đặt lịch thành công! Chúng tôi sẽ liên hệ bạn sớm nhất.');
}

function submitLogin(e) {
  e.preventDefault();
  closeModal('loginModal');
  showToast('✅ Đăng nhập thành công! Chào mừng bạn trở lại.');
}

function submitRegister(e) {
  e.preventDefault();
  closeModal('registerModal');
  showToast('🎉 Tạo tài khoản thành công! Chào mừng bạn đến với TarotLove.');
}

// ===== TOAST =====
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// ===== SCROLL TO READERS =====
function scrollToReaders() {
  document.getElementById('readers').scrollIntoView({ behavior: 'smooth' });
}

// ===== MOBILE MENU =====
function toggleMenu() {
  const nav = document.querySelector('.nav');
  const actions = document.querySelector('.header-actions');
  if (nav.style.display === 'flex') {
    nav.style.display = '';
    actions.style.display = '';
  } else {
    nav.style.cssText = 'display:flex; flex-direction:column; position:fixed; top:68px; left:0; right:0; background:rgba(15,10,30,0.98); padding:20px; gap:16px; border-bottom:1px solid var(--border); z-index:999;';
    actions.style.cssText = 'display:flex; position:fixed; top:200px; left:0; right:0; background:rgba(15,10,30,0.98); padding:16px 20px; gap:10px; z-index:999; justify-content:center;';
  }
}

// ===== HEADER SCROLL EFFECT =====
window.addEventListener('scroll', () => {
  const header = document.querySelector('.header');
  if (window.scrollY > 50) {
    header.style.boxShadow = '0 4px 24px rgba(0,0,0,0.4)';
  } else {
    header.style.boxShadow = '';
  }
});

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  renderReaders();
  initHeroCanvas();
  initMistEffect();
  initFloatingOrbs();
  initTypewriter();
});

// ===== HERO CANVAS — PARTICLE STARS =====
function initHeroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const particles = [];
  const COUNT = 160;

  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.8 + 0.3,
      speed: Math.random() * 0.0003 + 0.0001,
      opacity: Math.random() * 0.7 + 0.2,
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      color: Math.random() > 0.85
        ? `rgba(245,158,11,`   // gold
        : Math.random() > 0.7
          ? `rgba(167,139,250,` // purple
          : `rgba(255,255,255,` // white
    });
  }

  // Shooting stars
  const shootingStars = [];
  function spawnShootingStar() {
    shootingStars.push({
      x: Math.random() * 0.6 + 0.1,
      y: Math.random() * 0.4,
      len: Math.random() * 0.12 + 0.06,
      speed: Math.random() * 0.004 + 0.003,
      opacity: 1,
      angle: Math.PI / 5
    });
  }
  setInterval(spawnShootingStar, 2800);

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const W = canvas.width, H = canvas.height;

    // Draw particles
    particles.forEach(p => {
      p.twinkle += p.twinkleSpeed;
      const alpha = p.opacity * (0.6 + 0.4 * Math.sin(p.twinkle));
      ctx.beginPath();
      ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + alpha + ')';
      ctx.fill();
      p.y -= p.speed;
      if (p.y < 0) { p.y = 1; p.x = Math.random(); }
    });

    // Draw shooting stars
    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const s = shootingStars[i];
      const x1 = s.x * W, y1 = s.y * H;
      const x2 = x1 + Math.cos(s.angle) * s.len * W;
      const y2 = y1 + Math.sin(s.angle) * s.len * H;
      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, `rgba(255,255,255,${s.opacity})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      s.x += Math.cos(s.angle) * s.speed;
      s.y += Math.sin(s.angle) * s.speed;
      s.opacity -= 0.012;
      if (s.opacity <= 0) shootingStars.splice(i, 1);
    }

    requestAnimationFrame(draw);
  }
  draw();
}

// ===== MIST / FOG EFFECT =====
function initMistEffect() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  for (let i = 0; i < 5; i++) {
    const mist = document.createElement('div');
    mist.className = 'mist-layer';
    mist.style.cssText = `
      position:absolute; bottom:0; left:${-20 + i * 10}%;
      width:${140 + i * 30}%; height:${120 + i * 40}px;
      background: radial-gradient(ellipse at 50% 100%,
        rgba(${i % 2 === 0 ? '80,40,160' : '40,20,100'},0.18) 0%,
        transparent 70%);
      animation: mistDrift ${8 + i * 3}s ease-in-out infinite alternate;
      animation-delay: ${i * 1.2}s;
      pointer-events:none; z-index:1;
    `;
    hero.appendChild(mist);
  }
}

// ===== FLOATING ORBS =====
function initFloatingOrbs() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const orbColors = [
    'rgba(124,58,237,0.15)',
    'rgba(245,158,11,0.1)',
    'rgba(167,139,250,0.12)',
    'rgba(196,100,255,0.1)'
  ];
  for (let i = 0; i < 6; i++) {
    const orb = document.createElement('div');
    const size = 80 + Math.random() * 200;
    orb.style.cssText = `
      position:absolute;
      width:${size}px; height:${size}px;
      border-radius:50%;
      background: radial-gradient(circle, ${orbColors[i % orbColors.length]}, transparent 70%);
      left:${Math.random() * 90}%; top:${Math.random() * 80}%;
      animation: orbFloat ${10 + Math.random() * 10}s ease-in-out infinite alternate;
      animation-delay:${Math.random() * 5}s;
      pointer-events:none; z-index:0;
      filter: blur(${8 + Math.random() * 12}px);
    `;
    hero.appendChild(orb);
  }
}

// ===== TYPEWRITER EFFECT =====
function initTypewriter() {
  const el = document.getElementById('typewriterText');
  if (!el) return;
  const phrases = [
    'Người ấy có thích bạn không?',
    'Tình yêu của bạn đi về đâu?',
    'Người cũ có quay lại không?',
    'Mối quan hệ này có tương lai?',
    'Bạn có nên tiếp tục không?'
  ];
  let pi = 0, ci = 0, deleting = false;
  function type() {
    const phrase = phrases[pi];
    if (!deleting) {
      el.textContent = phrase.slice(0, ++ci);
      if (ci === phrase.length) { deleting = true; setTimeout(type, 2000); return; }
    } else {
      el.textContent = phrase.slice(0, --ci);
      if (ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; }
    }
    setTimeout(type, deleting ? 40 : 80);
  }
  type();
}
