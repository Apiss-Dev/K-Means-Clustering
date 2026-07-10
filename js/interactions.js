/* ============================================================
   MODAL DETAIL PROVINSI
   ============================================================ */
function buildMiniBarRow(label, value, compareValue, unit) {
  const maxV = Math.max(value, compareValue, 1);
  const w1 = Math.max((value / maxV) * 100, 2);
  const w2 = Math.max((compareValue / maxV) * 100, 2);
  return `
  <div class="detail-metric">
    <div class="detail-metric-label">${label}</div>
    <div class="detail-metric-row">
      <span class="detail-metric-tag">Provinsi ini</span>
      <div class="bar-track"><div class="bar-fill" style="width:${w1}%;background:#1976d2"></div></div>
      <span class="detail-metric-val">${fmt(value)}</span>
    </div>
    <div class="detail-metric-row">
      <span class="detail-metric-tag">Rata-rata klaster</span>
      <div class="bar-track"><div class="bar-fill" style="width:${w2}%;background:#9ca3af"></div></div>
      <span class="detail-metric-val">${fmt(compareValue)}</span>
    </div>
  </div>`;
}

function openDetailModal(provinsiName) {
  const raw = RAW_DATA.find(d => d.provinsi === provinsiName);
  const r = RESULTS[currentK];
  const row = r.rows.find(d => d.provinsi === provinsiName);
  if (!raw || !row) return;
  const col = TIER_COLOR[row.klaster];
  const avg = r.perLabel[row.klaster];
  const isSingleton = avg.count === 1;

  document.getElementById('detailModalContent').innerHTML = `
    <div class="detail-header">
      <div>
        <div class="detail-title">${raw.provinsi}</div>
        <span class="badge" style="background:${col.dark}">${row.klaster.toUpperCase()}</span>
      </div>
      <div class="detail-sil">
        <div class="label">Silhouette</div>
        <div class="value" style="color:${col.dark}">${isSingleton ? 'N/A' : row.silhouette.toFixed(4)}</div>
      </div>
    </div>
    <div class="detail-metrics">
      ${buildMiniBarRow('Jumlah Sekolah', raw.sekolah, avg.sekolah)}
      ${buildMiniBarRow('Jumlah Guru', raw.guru, avg.guru)}
      ${buildMiniBarRow('Jumlah Murid', raw.murid, avg.murid)}
    </div>
    <p class="detail-note">Perbandingan nilai provinsi ini terhadap rata-rata klaster "${row.klaster}" pada k=${currentK}.</p>
  `;
  document.getElementById('detailModalOverlay').classList.add('open');
  document.body.classList.add('modal-open');
}

function closeDetailModal() {
  document.getElementById('detailModalOverlay').classList.remove('open');
  document.body.classList.remove('modal-open');
}

/* ============================================================
   BANDINGKAN 2 PROVINSI
   ============================================================ */
function populateCompareSelects() {
  const selA = document.getElementById('compareA');
  const selB = document.getElementById('compareB');
  if (!selA || !selB) return;
  const prevA = selA.value, prevB = selB.value;
  const options = RAW_DATA.slice().sort((a,b) => a.provinsi.localeCompare(b.provinsi))
    .map(d => `<option value="${d.provinsi}">${d.provinsi}</option>`).join('');
  selA.innerHTML = options;
  selB.innerHTML = options;
  selA.value = prevA || RAW_DATA[10].provinsi; // default DKI Jakarta
  selB.value = prevB || RAW_DATA[35].provinsi; // default Papua Selatan
  compareProvinces();
}

function compareProvinces() {
  const nameA = document.getElementById('compareA').value;
  const nameB = document.getElementById('compareB').value;
  const r = RESULTS[currentK];
  const rawA = RAW_DATA.find(d => d.provinsi === nameA);
  const rawB = RAW_DATA.find(d => d.provinsi === nameB);
  const rowA = r.rows.find(d => d.provinsi === nameA);
  const rowB = r.rows.find(d => d.provinsi === nameB);
  if (!rawA || !rawB) return;
  const colA = TIER_COLOR[rowA.klaster];
  const colB = TIER_COLOR[rowB.klaster];

  const metrics = [
    { key: 'sekolah', label: 'Jumlah Sekolah' },
    { key: 'guru', label: 'Jumlah Guru' },
    { key: 'murid', label: 'Jumlah Murid' }
  ];

  const rows = metrics.map(m => {
    const maxV = Math.max(rawA[m.key], rawB[m.key], 1);
    const wA = Math.max((rawA[m.key] / maxV) * 100, 2);
    const wB = Math.max((rawB[m.key] / maxV) * 100, 2);
    return `
    <div class="compare-metric">
      <div class="compare-metric-label">${m.label}</div>
      <div class="compare-metric-row">
        <span class="compare-val">${fmt(rawA[m.key])}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${wA}%;background:${colA.mid}"></div></div>
      </div>
      <div class="compare-metric-row compare-metric-row-b">
        <div class="bar-track"><div class="bar-fill" style="width:${wB}%;background:${colB.mid}"></div></div>
        <span class="compare-val">${fmt(rawB[m.key])}</span>
      </div>
    </div>`;
  }).join('');

  document.getElementById('compareResult').innerHTML = `
    <div class="compare-heads">
      <div class="compare-head">
        <div class="compare-name">${rawA.provinsi}</div>
        <span class="badge" style="background:${colA.dark}">${rowA.klaster}</span>
      </div>
      <div class="compare-vs">VS</div>
      <div class="compare-head compare-head-b">
        <div class="compare-name">${rawB.provinsi}</div>
        <span class="badge" style="background:${colB.dark}">${rowB.klaster}</span>
      </div>
    </div>
    ${rows}
  `;
}

/* ============================================================
   EKSPOR CSV
   ============================================================ */
function exportCSV() {
  const r = RESULTS[currentK];
  const header = ['No','Provinsi','Klaster',`Silhouette`,'Sekolah','Guru','Murid'];
  const lines = [header.join(',')];
  r.rows.forEach((d, i) => {
    const isSingleton = r.perLabel[d.klaster].count === 1;
    const sil = isSingleton ? 'N/A' : d.silhouette.toFixed(4);
    lines.push([i+1, `"${d.provinsi}"`, `"${d.klaster}"`, sil, d.sekolah, d.guru, d.murid].join(','));
  });
  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `klasterisasi-sma-k${currentK}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ============================================================
   MODE GELAP
   ============================================================ */
function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem('dashboard-theme'); } catch (e) { /* abaikan */ }
  const theme = saved || 'light';
  applyTheme(theme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  try { localStorage.setItem('dashboard-theme', theme); } catch (e) { /* abaikan */ }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

/* ============================================================
   EVENT GLOBAL (modal close, ESC, dsb)
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('detailModalOverlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeDetailModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDetailModal();
  });
  initTheme();
});
