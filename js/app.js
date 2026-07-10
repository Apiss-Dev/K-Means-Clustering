/* ============================================================
   STATE & RENDER
   ============================================================ */
let currentK = 3;
let currentFilter = 'Semua';
let currentSearch = '';
let sortCol = 'no';
let sortAsc = true;

function fmt(n) { return Math.round(n).toLocaleString('id-ID'); }
function fmtDec(n, dp=3) { return n.toFixed(dp).replace('.', ','); }

function renderKButtons() {
  const el = document.getElementById('kBtns');
  el.innerHTML = [2,3,4,5].map(k => `
    <button class="k-btn ${k===currentK?'active':''}" onclick="setK(${k})">
      ${k}${k===3?'<span class="k-default-dot" title="Default"></span>':''}
    </button>
  `).join('');
}

function renderMetrics() {
  const r = RESULTS[currentK];
  document.getElementById('metricsRow').innerHTML = `
    <div class="metric-card">
      <div class="label">Total Provinsi</div>
      <div class="value">38</div>
      <div class="sub">Unit analisis</div>
    </div>
    <div class="metric-card">
      <div class="label">Jumlah Klaster</div>
      <div class="value">${currentK}</div>
      <div class="sub">K-Means, k = ${currentK}</div>
    </div>
    <div class="metric-card sil">
      <div class="label">Silhouette Score</div>
      <div class="value">${fmtDec(r.overallSil)}</div>
      <div class="sub">${r.overallSil >= 0.4 ? 'Kualitas baik &gt; 0,40' : (r.overallSil >= 0.25 ? 'Kualitas cukup' : 'Struktur klaster lemah')}</div>
    </div>
    <div class="metric-card db">
      <div class="label">Davies-Bouldin Index</div>
      <div class="value">${fmtDec(r.db)}</div>
      <div class="sub">Nilai rendah = lebih baik</div>
    </div>
  `;
  document.getElementById('footerMethod').textContent = `K-Means Clustering (k=${currentK})`;
  document.getElementById('clusterSummaryTitle').textContent = `Ringkasan ${currentK} Klaster`;
}

function renderClusterCards() {
  const r = RESULTS[currentK];
  document.getElementById('clusterCards').innerHTML = r.labels.map(label => {
    const col = TIER_COLOR[label];
    const p = r.perLabel[label];
    return `
    <div class="cluster-card" style="background:${col.light};border-color:${col.border}">
      <div class="badge" style="background:${col.dark}">${label.toUpperCase()}</div>
      <div class="prov-count" style="color:${col.dark}">${p.count}</div>
      <div class="prov-label">provinsi</div>
      <div class="stats-mini">
        <div class="stat-row"><span class="stat-label">Rata-rata Sekolah</span><span class="stat-val">${fmt(p.sekolah)}</span></div>
        <div class="stat-row"><span class="stat-label">Rata-rata Guru</span><span class="stat-val">${fmt(p.guru)}</span></div>
        <div class="stat-row"><span class="stat-label">Rata-rata Murid</span><span class="stat-val">${fmt(p.murid)}</span></div>
        <div class="stat-row"><span class="stat-label">Rata-rata Silhouette</span><span class="stat-val" ${p.count===1?'title="Tidak terdefinisi: klaster hanya berisi 1 provinsi"':''}>${p.count===1?'N/A':fmtDec(p.sil,4)}</span></div>
      </div>
    </div>`;
  }).join('');
}

function renderCharts() {
  const r = RESULTS[currentK];
  const metrics = [
    {key:'sekolah', title:'Perbandingan Rata-rata Jumlah Sekolah per Klaster'},
    {key:'guru', title:'Perbandingan Rata-rata Jumlah Guru per Klaster'},
    {key:'murid', title:'Perbandingan Rata-rata Jumlah Murid per Klaster'}
  ];
  document.getElementById('chartsRow').innerHTML = metrics.map(m => {
    const maxVal = Math.max(...r.labels.map(l => r.perLabel[l][m.key]));
    const bars = r.labels.map(label => {
      const col = TIER_COLOR[label];
      const v = r.perLabel[label][m.key];
      const w = maxVal ? Math.max((v/maxVal*100), 2) : 2;
      return `
      <div class="bar-row">
        <div class="bar-header"><span>${label}</span><span>${fmt(v)}</span></div>
        <div class="bar-track"><div class="bar-fill" style="width:${w}%;background:${col.mid}"></div></div>
      </div>`;
    }).join('');
    return `<div class="chart-card"><h3>${m.title}</h3><div class="bar-chart">${bars}</div></div>`;
  }).join('');
}

function renderFilterBar() {
  const r = RESULTS[currentK];
  const searchInput = document.getElementById('searchInput');
  const btnsHtml = [`<button class="filter-btn active-all" onclick="filterTable('Semua', this)">Semua (38)</button>`]
    .concat(r.labels.map(label => {
      const count = r.perLabel[label].count;
      return `<button class="filter-btn" data-label="${label}" onclick="filterTable('${label}', this)">${label} (${count})</button>`;
    }));
  const bar = document.getElementById('filterBar');
  const prevVal = searchInput ? searchInput.value : currentSearch;
  bar.innerHTML = btnsHtml.join('') +
    `<input class="search-input" id="searchInput" type="text" placeholder="Search..." oninput="searchTable(this.value)">` +
    `<div class="search-hint">Tips: Ketik nama provinsi, atau nama klaster di kotak pencarian di atas untuk memfilter langsung.</div>`;
  document.getElementById('searchInput').value = prevVal;
  applyActiveFilterStyle();
}

function applyActiveFilterStyle() {
  document.querySelectorAll('.filter-btn').forEach(b => {
    const label = b.dataset.label;
    if (!label) {
      if (currentFilter === 'Semua') { b.classList.add('active-all'); b.style.background=''; b.style.color=''; b.style.borderColor=''; }
      else { b.classList.remove('active-all'); }
      return;
    }
    const col = TIER_COLOR[label];
    if (currentFilter === label) {
      b.style.background = col.dark; b.style.color = 'white'; b.style.borderColor = col.dark;
    } else {
      b.style.background = ''; b.style.color = ''; b.style.borderColor = '';
    }
  });
}

function renderTable() {
  const r = RESULTS[currentK];
  let data = r.rows.map((d, i) => ({...d, no: i+1}));

  if (currentFilter !== 'Semua') {
    data = data.filter(d => d.klaster === currentFilter);
  }

  if (currentSearch.trim()) {
    const q = currentSearch.trim().toLowerCase();
    data = data.filter(d =>
      d.provinsi.toLowerCase().includes(q) ||
      d.klaster.toLowerCase().includes(q)
    );
  }

  data.sort((a,b) => {
    const av = a[sortCol], bv = b[sortCol];
    let cmp;
    if (typeof av === 'string') cmp = av.localeCompare(bv);
    else cmp = av - bv;
    return sortAsc ? cmp : -cmp;
  });

  const tbody = document.getElementById('tableBody');
  if (data.length === 0) {
    tbody.innerHTML = `<tr class="no-result"><td colspan="7">Tidak ada provinsi yang cocok dengan pencarian/filter ini.</td></tr>`;
    return;
  }
  tbody.innerHTML = data.map((d, i) => {
    const col = TIER_COLOR[d.klaster];
    const isSingleton = r.perLabel[d.klaster].count === 1;
    return `
    <tr class="clickable-row" onclick="openDetailModal('${d.provinsi.replace(/'/g,"\\'")}')" title="Klik untuk lihat detail ${d.provinsi}">
      <td style="color:var(--text-muted);font-size:12px">${i+1}</td>
      <td style="font-weight:600">${d.provinsi}</td>
      <td><span class="klaster-pill" style="background:${col.dark}">${d.klaster}</span></td>
      <td>${fmt(d.sekolah)}</td>
      <td>${fmt(d.guru)}</td>
      <td>${fmt(d.murid)}</td>
      <td>
        ${isSingleton ? `<span class="sil-val" title="Tidak terdefinisi: klaster hanya berisi 1 provinsi">N/A</span>` : `
        <div class="sil-bar-wrap">
          <div class="sil-bar" style="width:${Math.max(Math.round(d.silhouette*60),1)}px;background:${d.silhouette>=0.4?'#1a6b3c':(d.silhouette>=0.2?'#0d4f8c':'#8b1a1a')}"></div>
          <span class="sil-val">${d.silhouette.toFixed(4)}</span>
        </div>`}
      </td>
    </tr>`;
  }).join('');
}

function renderReko() {
  const r = RESULTS[currentK];
  document.getElementById('rekoGrid').innerHTML = r.labels.slice().reverse().map(label => {
    const col = TIER_COLOR[label];
    const items = REKO_TEXT[label] || [];
    return `
    <div class="reko-card">
      <div class="reko-header">
        <div class="reko-dot" style="background:${col.dark}"></div>
        <h4>Klaster ${label}</h4>
      </div>
      <ul>${items.map(t => `<li>${t}</li>`).join('')}</ul>
    </div>`;
  }).join('');
}

function renderAll() {
  renderKButtons();
  renderMetrics();
  renderClusterCards();
  renderCharts();
  renderEvaluation();
  renderScatter();
  renderMap();
  renderFilterBar();
  renderTable();
  renderReko();
  populateCompareSelects();
}

function setK(k) {
  currentK = k;
  currentFilter = 'Semua';
  currentSearch = '';
  renderAll();
}

function filterTable(label, btn) {
  currentFilter = label;
  applyActiveFilterStyle();
  renderTable();
}

function searchTable(val) {
  currentSearch = val;
  // jika teks pencarian persis cocok salah satu label klaster, otomatis set filter juga
  const r = RESULTS[currentK];
  const match = r.labels.find(l => l.toLowerCase() === val.trim().toLowerCase());
  if (match) { currentFilter = match; applyActiveFilterStyle(); }
  else if (val.trim() === '') { currentFilter = 'Semua'; applyActiveFilterStyle(); }
  renderTable();
}

function sortTable(col) {
  if (sortCol === col) sortAsc = !sortAsc;
  else { sortCol = col; sortAsc = true; }
  renderTable();
}

/* ============================================================
   NAVBAR & UX INTERAKTIF (baru)
   - toggle menu mobile
   - highlight link aktif sesuai scroll (scroll-spy)
   - tombol back-to-top
   - navbar mengecil (compact) saat discroll
   ============================================================ */
function initNavbar() {
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-link');
  const backToTop = document.getElementById('backToTop');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      navToggle.classList.toggle('open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
      document.body.classList.toggle('nav-menu-open', isOpen);
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-menu-open');
      });
    });
  }

  window.addEventListener('scroll', () => {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 12);
    if (backToTop) backToTop.classList.toggle('show', window.scrollY > 480);
  }, { passive: true });

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  const sections = Array.from(document.querySelectorAll('main section[id]'));
  if (sections.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id = entry.target.getAttribute('id');
        const link = document.querySelector(`.nav-link[href="#${id}"]`);
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(s => observer.observe(s));
  }
}

renderAll();
initNavbar();
