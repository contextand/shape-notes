let data = [];
let activeCategory = '';
let balls = [];
let animationId = null;

const BALL_RADIUS = 45;

const BALL_CONFIG = [
  { cat: '',           label: ['전체'],           color: '#111111', fixed: true },
  { cat: '곡선과 흐름', label: ['곡선과', '흐름'],  color: '#2563EB' },
  { cat: '단순한 정보', label: ['단순한', '정보'],  color: '#EA580C' },
  { cat: '대칭과 균형', label: ['대칭과', '균형'],  color: '#7C3AED' },
  { cat: '명료한 대비', label: ['명료한', '대비'],  color: '#DC2626' },
  { cat: '반복과 리듬', label: ['반복과', '리듬'],  color: '#059669' },
  { cat: '비례와 안정', label: ['비례와', '안정'],  color: '#0891B2' },
  { cat: '빛과 조형',   label: ['빛과', '조형'],    color: '#B45309' },
  { cat: '여백과 집중', label: ['여백과', '집중'],  color: '#DB2777' },
  { cat: '움직이는 타입', label: ['움직이는', '타입'], color: '#4338CA' },
  { cat: '질감과 촉감', label: ['질감과', '촉감'],  color: '#047857' },
];

async function init() {
  const res = await fetch('info.json');
  data = await res.json();
  renderCategoryBar();
  renderMobilePanel();
  renderGrid(data);
  setupEvents();
  if (window.innerWidth < 550) {
    setupMobileBalls();
  } else {
    setupMobileFab();
  }
  setupBalls();
}

function renderCategoryBar() {
  const bar = document.getElementById('category-bar');
  const categories = [...new Set(data.map(d => d.category))];
  bar.innerHTML =
    `<button class="chip active" data-cat="">전체</button>` +
    categories.map(cat => `<button class="chip" data-cat="${cat}">${cat}</button>`).join('');
}

function renderMobilePanel() {
  const panel = document.getElementById('cat-panel');
  const categories = [...new Set(data.map(d => d.category))];
  panel.innerHTML = ['', ...categories].map(cat => {
    const label = cat === '' ? '전체' : cat;
    return `<button class="cat-item${cat === activeCategory ? ' active' : ''}" data-cat="${cat}">${label}</button>`;
  }).join('');
}

function setCategory(cat) {
  activeCategory = cat;
  // Sync desktop chips
  document.querySelectorAll('#category-bar .chip').forEach(c => {
    c.classList.toggle('active', c.dataset.cat === cat);
  });
  // Sync balls
  document.querySelectorAll('#balls-layer .ball').forEach(b => {
    b.classList.toggle('active', b.dataset.cat === cat);
  });
  const filtered = cat ? data.filter(d => d.category === cat) : data;
  renderGrid(filtered);
}

function renderGrid(items) {
  document.getElementById('grid').innerHTML = items.map((item, i) => {
    const loading = i < 12 ? 'eager' : 'lazy';
    const priority = i < 6 ? 'fetchpriority="high"' : '';
    return `
    <div class="card" data-no="${item.no}">
      <div class="card-img-wrap">
        <img src="img/${item.no}.jpg" alt="${item.title}" loading="${loading}" ${priority} decoding="async">
        <span class="cat-badge">${item.category}</span>
      </div>
    </div>`;
  }).join('');
}

function returnToGallery() {
  document.getElementById('detail-view').classList.add('hidden');
  document.getElementById('gallery-view').classList.remove('hidden');
  document.getElementById('mobile-balls-layer').style.display = '';
  showBallsLayer();
  window.scrollTo(0, 0);
}

function showDetail(item) {
  const alreadyInDetail = !document.getElementById('detail-view').classList.contains('hidden');
  if (alreadyInDetail) {
    history.replaceState({ view: 'detail', no: item.no }, '');
  } else {
    history.pushState({ view: 'detail', no: item.no }, '');
  }

  document.getElementById('gallery-view').classList.add('hidden');
  document.getElementById('detail-view').classList.remove('hidden');
  despawnMobileBalls();
  mobileBallsOpen = false;
  document.getElementById('mobile-balls-layer').style.display = 'none';
  hideBalls();

  const img = document.getElementById('detail-img');
  img.src = `img/${item.no}.jpg`;
  img.alt = item.title;
  document.getElementById('detail-cat-badge').textContent = item.category;
  document.getElementById('detail-title').textContent = item.title;
  document.getElementById('detail-sub').textContent = item.sub;
  document.getElementById('detail-tags').innerHTML =
    item.tag.map(t => `<span class="tag">#${t}</span>`).join('');

  const related = data.filter(d => d.category === item.category && d.no !== item.no);
  const relatedWrap = document.getElementById('related-wrap');
  const relatedGrid = document.getElementById('related-grid');

  if (related.length > 0) {
    relatedGrid.innerHTML = related.map(r => `
      <div class="related-card" data-no="${r.no}">
        <img src="img/${r.no}.jpg" alt="${r.title}" loading="lazy">
      </div>`).join('');
    relatedWrap.classList.remove('hidden');
  } else {
    relatedWrap.classList.add('hidden');
  }

  window.scrollTo(0, 0);
}

function setupEvents() {
  document.getElementById('grid').addEventListener('click', e => {
    const card = e.target.closest('.card');
    if (!card) return;
    const item = data.find(d => d.no === parseInt(card.dataset.no));
    if (item) showDetail(item);
  });

  document.getElementById('related-grid').addEventListener('click', e => {
    const card = e.target.closest('.related-card');
    if (!card) return;
    const item = data.find(d => d.no === parseInt(card.dataset.no));
    if (item) showDetail(item);
  });

  document.getElementById('back-btn').addEventListener('click', () => {
    history.back();
  });

  window.addEventListener('popstate', () => {
    if (!document.getElementById('detail-view').classList.contains('hidden')) {
      returnToGallery();
    }
  });

  document.getElementById('category-bar').addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    setCategory(chip.dataset.cat);
  });
}

function setupMobileFab() {
  const fab = document.getElementById('cat-fab');
  const panel = document.getElementById('cat-panel');

  fab.addEventListener('click', () => {
    const isOpen = panel.classList.contains('open');
    if (isOpen) {
      panel.classList.remove('open');
    } else {
      renderMobilePanel();
      panel.classList.add('open');
    }
  });

  panel.addEventListener('click', e => {
    const item = e.target.closest('.cat-item');
    if (!item) return;
    setCategory(item.dataset.cat);
    panel.classList.remove('open');
  });
}

// ===== Floating Ball System (desktop only) =====

function setupBalls() {
  if (window.innerWidth < 550) return;

  const layer = document.getElementById('balls-layer');
  layer.innerHTML = '';
  balls = [];

  const W = window.innerWidth;
  const H = window.innerHeight;

  BALL_CONFIG.forEach(cfg => {
    const el = document.createElement('div');
    el.className = 'ball';
    el.dataset.cat = cfg.cat;
    el.style.setProperty('--ball-color', cfg.color);
    cfg.label.forEach(line => {
      const span = document.createElement('span');
      span.textContent = line;
      el.appendChild(span);
    });

    // Mark "전체" as initially active
    if (cfg.cat === activeCategory) el.classList.add('active');

    if (cfg.fixed) {
      el.classList.add('ball-fixed');
    } else {
      // Random position away from edges
      const margin = BALL_RADIUS + 20;
      const x = margin + Math.random() * (W - margin * 2);
      const y = margin + Math.random() * (H - margin * 2);
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.45 + Math.random() * 0.65;

      const ballData = {
        el, x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        baseSpeed: speed,
        phase: Math.random() * Math.PI * 2,     // random start in cycle
        phaseRate: 0.003 + Math.random() * 0.007, // each ball at a different cycle rate
        hovering: false,
      };

      el.style.transform = `translate(${x - BALL_RADIUS}px, ${y - BALL_RADIUS}px)`;

      el.addEventListener('mouseenter', () => { ballData.hovering = true; });
      el.addEventListener('mouseleave', () => { ballData.hovering = false; });

      balls.push(ballData);
    }

    el.addEventListener('click', () => setCategory(cfg.cat));
    layer.appendChild(el);
  });

  startAnimation();
}

function startAnimation() {
  if (animationId) cancelAnimationFrame(animationId);

  function step() {
    const W = window.innerWidth;
    const H = window.innerHeight;

    for (const ball of balls) {
      if (ball.hovering) continue;

      // 1. Speed cycle: sin wave creates slow accel/decel (each ball at own tempo)
      ball.phase += ball.phaseRate;
      const speedFactor = 0.25 + 1.5 * (0.5 + 0.5 * Math.sin(ball.phase)); // 0.25→1.75×
      const targetSpeed = ball.baseSpeed * speedFactor;

      // 2. Inertia: gently converge current speed toward target (creates lag / mass feel)
      const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) || 0.01;
      const newSpeed = currentSpeed + (targetSpeed - currentSpeed) * 0.012;
      const scale = newSpeed / currentSpeed;
      ball.vx *= scale;
      ball.vy *= scale;

      // 3. Micro drift: tiny random nudge bends the path into subtle curves
      ball.vx += (Math.random() - 0.5) * 0.002;
      ball.vy += (Math.random() - 0.5) * 0.002;

      ball.x += ball.vx;
      ball.y += ball.vy;

      // Bounce off edges
      if (ball.x < BALL_RADIUS)          { ball.x = BALL_RADIUS;      ball.vx =  Math.abs(ball.vx); }
      else if (ball.x > W - BALL_RADIUS) { ball.x = W - BALL_RADIUS;  ball.vx = -Math.abs(ball.vx); }
      if (ball.y < BALL_RADIUS)          { ball.y = BALL_RADIUS;      ball.vy =  Math.abs(ball.vy); }
      else if (ball.y > H - BALL_RADIUS) { ball.y = H - BALL_RADIUS;  ball.vy = -Math.abs(ball.vy); }

      ball.el.style.transform = `translate(${ball.x - BALL_RADIUS}px, ${ball.y - BALL_RADIUS}px)`;
    }

    animationId = requestAnimationFrame(step);
  }

  animationId = requestAnimationFrame(step);
}

function hideBalls() {
  const layer = document.getElementById('balls-layer');
  if (layer) layer.style.display = 'none';
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

function showBallsLayer() {
  const layer = document.getElementById('balls-layer');
  if (layer) layer.style.display = '';
  if (window.innerWidth >= 550) startAnimation();
}

// ===== Mobile Ball System =====

const MOBILE_BALL_R = 42; // 84px diameter — 4 per row
let mobileBalls = [];
let mobileBallsOpen = false;

function setupMobileBalls() {
  const layer = document.getElementById('mobile-balls-layer');
  const fabEl = document.createElement('div');
  fabEl.className = 'mobile-ball mobile-ball-fab';
  fabEl.style.setProperty('--ball-color', '#111111');
  const sp = document.createElement('span');
  sp.textContent = '분류';
  fabEl.appendChild(sp);
  fabEl.addEventListener('click', toggleMobileBalls);
  layer.appendChild(fabEl);
}

function toggleMobileBalls() {
  if (mobileBallsOpen) {
    despawnMobileBalls();
  } else {
    spawnMobileBalls();
  }
  mobileBallsOpen = !mobileBallsOpen;
}

function spawnMobileBalls() {
  const layer = document.getElementById('mobile-balls-layer');
  const W = window.innerWidth;
  const H = window.innerHeight;
  const D = MOBILE_BALL_R * 2;
  const MARGIN = 12;
  mobileBalls = [];

  // Pre-seed obstacles: include the '분류' fab ball position so nothing overlaps it
  const placed = [{ x: W - MOBILE_BALL_R, y: H - MOBILE_BALL_R }];

  // Shuffle order so appearance sequence is different each tap
  const shuffled = [...BALL_CONFIG].sort(() => Math.random() - 0.5);

  shuffled.forEach((cfg, i) => {
    // Rejection sampling: find a random non-overlapping position
    let x, y, tries = 0;
    do {
      x = MARGIN + MOBILE_BALL_R + Math.random() * (W - (MARGIN + MOBILE_BALL_R) * 2);
      y = MARGIN + MOBILE_BALL_R + Math.random() * (H - MOBILE_BALL_R * 3 - MARGIN);
      tries++;
    } while (tries < 80 && placed.some(p => {
      const dx = p.x - x, dy = p.y - y;
      return Math.sqrt(dx * dx + dy * dy) < D + 6;
    }));
    placed.push({ x, y });

    const el = document.createElement('div');
    el.className = 'mobile-ball';
    el.style.setProperty('--ball-color', cfg.color);
    cfg.label.forEach(line => {
      const sp = document.createElement('span');
      sp.textContent = line;
      el.appendChild(sp);
    });
    el.addEventListener('click', () => {
      setCategory(cfg.cat);
      despawnMobileBalls();
      mobileBallsOpen = false;
    });

    const delay = i * 35;
    el.style.opacity = '0';
    el.style.transform = `translate(${x - MOBILE_BALL_R}px, ${y - MOBILE_BALL_R}px) scale(0.65)`;
    layer.appendChild(el);

    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.transition = `opacity 0.22s ease ${delay}ms, transform 0.22s ease ${delay}ms`;
      el.style.opacity = '1';
      el.style.transform = `translate(${x - MOBILE_BALL_R}px, ${y - MOBILE_BALL_R}px) scale(1)`;
    }));

    mobileBalls.push({ el, x, y });
  });
}

function despawnMobileBalls() {
  if (mobileBalls.length === 0) return;
  const snapshot = [...mobileBalls];
  mobileBalls = [];
  snapshot.forEach(b => {
    b.el.style.transition = 'opacity 0.16s ease, transform 0.16s ease';
    b.el.style.opacity = '0';
    b.el.style.transform = `translate(${b.x - MOBILE_BALL_R}px, ${b.y - MOBILE_BALL_R}px) scale(0.75)`;
  });
  setTimeout(() => snapshot.forEach(b => b.el.remove()), 180);
}

init();
