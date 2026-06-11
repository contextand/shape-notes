let data = [];
let activeCategory = '';

async function init() {
  const res = await fetch('info.json');
  data = await res.json();
  renderCategoryBar();
  renderGrid(data);
  setupEvents();
}

function renderCategoryBar() {
  const bar = document.getElementById('category-bar');
  const categories = [...new Set(data.map(d => d.category))];
  bar.innerHTML =
    `<button class="chip active" data-cat="">전체</button>` +
    categories.map(cat => `<button class="chip" data-cat="${cat}">${cat}</button>`).join('');
}

function renderGrid(items) {
  document.getElementById('grid').innerHTML = items.map(item => `
    <div class="card" data-no="${item.no}">
      <div class="card-img-wrap">
        <img src="img/${item.no}.jpg" alt="${item.title}" loading="lazy">
        <span class="cat-badge">${item.category}</span>
      </div>
      <div class="card-title">${item.title}</div>
    </div>
  `).join('');
}

function showDetail(item) {
  document.getElementById('gallery-view').classList.add('hidden');
  const detailView = document.getElementById('detail-view');
  detailView.classList.remove('hidden');

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
  // Gallery grid: event delegation
  document.getElementById('grid').addEventListener('click', e => {
    const card = e.target.closest('.card');
    if (!card) return;
    const item = data.find(d => d.no === parseInt(card.dataset.no));
    if (item) showDetail(item);
  });

  // Related grid: event delegation
  document.getElementById('related-grid').addEventListener('click', e => {
    const card = e.target.closest('.related-card');
    if (!card) return;
    const item = data.find(d => d.no === parseInt(card.dataset.no));
    if (item) showDetail(item);
  });

  // Back button
  document.getElementById('back-btn').addEventListener('click', () => {
    document.getElementById('detail-view').classList.add('hidden');
    document.getElementById('gallery-view').classList.remove('hidden');
    window.scrollTo(0, 0);
  });

  // Category bar: event delegation
  document.getElementById('category-bar').addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll('#category-bar .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeCategory = chip.dataset.cat;
    const filtered = activeCategory
      ? data.filter(d => d.category === activeCategory)
      : data;
    renderGrid(filtered);
  });
}

init();
