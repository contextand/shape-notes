let data = [];
let activeCategory = '';

async function init() {
  const res = await fetch('info.json');
  data = await res.json();
  renderCategoryBar();
  renderMobilePanel();
  renderGrid(data);
  setupEvents();
  setupMobileFab();
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
  const all = ['', ...categories];
  panel.innerHTML = all.map(cat => {
    const label = cat === '' ? '전체' : cat;
    const isActive = cat === activeCategory;
    return `<button class="cat-item${isActive ? ' active' : ''}" data-cat="${cat}">${label}</button>`;
  }).join('');
}

function setCategory(cat) {
  activeCategory = cat;
  // Sync desktop chips
  document.querySelectorAll('#category-bar .chip').forEach(c => {
    c.classList.toggle('active', c.dataset.cat === cat);
  });
  const filtered = cat ? data.filter(d => d.category === cat) : data;
  renderGrid(filtered);
}

function renderGrid(items) {
  document.getElementById('grid').innerHTML = items.map(item => `
    <div class="card" data-no="${item.no}">
      <div class="card-img-wrap">
        <img src="img/${item.no}.jpg" alt="${item.title}" loading="lazy">
        <span class="cat-badge">${item.category}</span>
      </div>
    </div>
  `).join('');
}

function showDetail(item) {
  document.getElementById('gallery-view').classList.add('hidden');
  document.getElementById('detail-view').classList.remove('hidden');

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
      </div>
    `).join('');
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
    document.getElementById('detail-view').classList.add('hidden');
    document.getElementById('gallery-view').classList.remove('hidden');
    window.scrollTo(0, 0);
  });

  // Desktop category bar
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
      renderMobilePanel(); // refresh active states before opening
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

init();
