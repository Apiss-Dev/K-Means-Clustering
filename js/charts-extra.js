/* ============================================================
   GRAFIK EVALUASI MODEL: Elbow Method & Silhouette per-k
   ============================================================ */
function renderEvaluation() {
  const ks = [2, 3, 4, 5];
  const sseVals = ks.map(k => RESULTS[k].sse);
  const silVals = ks.map(k => RESULTS[k].overallSil);

  document.getElementById('evalElbow').innerHTML = buildLineChartSVG(ks, sseVals, {
    color: '#1976d2',
    yLabel: 'SSE (Inertia)',
    decimals: 1
  });
  document.getElementById('evalSilhouette').innerHTML = buildLineChartSVG(ks, silVals, {
    color: '#6b21a8',
    yLabel: 'Silhouette Score',
    decimals: 3
  });
}

function buildLineChartSVG(ks, values, opts) {
  const w = 320, h = 170, padL = 38, padR = 16, padT = 16, padB = 28;
  const innerW = w - padL - padR, innerH = h - padT - padB;
  const minV = Math.min(...values), maxV = Math.max(...values);
  const range = (maxV - minV) || 1;

  const xFor = (i) => padL + (i / (ks.length - 1)) * innerW;
  const yFor = (v) => padT + innerH - ((v - minV) / range) * innerH;

  const points = values.map((v, i) => `${xFor(i)},${yFor(v)}`).join(' ');

  const dots = values.map((v, i) => {
    const isActive = ks[i] === currentK;
    return `
      <circle cx="${xFor(i)}" cy="${yFor(v)}" r="${isActive ? 6 : 4}"
        fill="${isActive ? opts.color : '#fff'}" stroke="${opts.color}" stroke-width="2"
        style="cursor:pointer" onclick="setK(${ks[i]})">
        <title>k=${ks[i]}: ${v.toFixed(opts.decimals)}</title>
      </circle>
      <text x="${xFor(i)}" y="${h - 8}" font-size="10" fill="#6b7280" text-anchor="middle">k=${ks[i]}</text>
      <text x="${xFor(i)}" y="${yFor(v) - 10}" font-size="10" fill="${isActive ? opts.color : '#9ca3af'}"
        text-anchor="middle" font-weight="${isActive ? 700 : 400}">${v.toFixed(opts.decimals)}</text>
    `;
  }).join('');

  return `
  <svg viewBox="0 0 ${w} ${h}" width="100%" role="img" aria-label="${opts.yLabel} per jumlah klaster">
    <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + innerH}" stroke="#e5e7eb" stroke-width="1"/>
    <line x1="${padL}" y1="${padT + innerH}" x2="${padL + innerW}" y2="${padT + innerH}" stroke="#e5e7eb" stroke-width="1"/>
    <polyline points="${points}" fill="none" stroke="${opts.color}" stroke-width="2" opacity="0.55"/>
    ${dots}
  </svg>`;
}

/* ============================================================
   SCATTER PLOT PCA 2D
   ============================================================ */
const PCA_RESULT = computePCA2D(GLOBAL_XSTD);

function renderScatter() {
  const r = RESULTS[currentK];
  const pts = PCA_RESULT.points;
  const w = 640, h = 380, pad = 30;

  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const xRange = (xMax - xMin) || 1, yRange = (yMax - yMin) || 1;

  const xFor = (x) => pad + ((x - xMin) / xRange) * (w - pad*2);
  const yFor = (y) => pad + (1 - (y - yMin) / yRange) * (h - pad*2);

  const circles = pts.map((p, i) => {
    const row = r.rows[i];
    const col = TIER_COLOR[row.klaster];
    return `
    <circle cx="${xFor(p.x)}" cy="${yFor(p.y)}" r="6.5" fill="${col.mid}" stroke="${col.dark}" stroke-width="1.5"
      opacity="0.88" style="cursor:pointer" onclick="openDetailModal('${row.provinsi.replace(/'/g,"\\'")}')">
      <title>${row.provinsi} — ${row.klaster}</title>
    </circle>`;
  }).join('');

  const legend = r.labels.map(label => {
    const col = TIER_COLOR[label];
    return `<span class="scatter-legend-item"><span class="dot" style="background:${col.mid}"></span>${label}</span>`;
  }).join('');

  document.getElementById('scatterPlot').innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" width="100%" role="img" aria-label="Scatter plot PCA 2 dimensi provinsi berdasarkan klaster">
      <line x1="${pad}" y1="${h-pad}" x2="${w-pad}" y2="${h-pad}" stroke="#e5e7eb"/>
      <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${h-pad}" stroke="#e5e7eb"/>
      <text x="${w/2}" y="${h-6}" font-size="11" fill="#6b7280" text-anchor="middle">Komponen Utama 1 (${(PCA_RESULT.varExplained[0]*100).toFixed(1)}% varians)</text>
      <text x="12" y="${h/2}" font-size="11" fill="#6b7280" text-anchor="middle" transform="rotate(-90 12 ${h/2})">Komponen Utama 2 (${(PCA_RESULT.varExplained[1]*100).toFixed(1)}%)</text>
      ${circles}
    </svg>`;
  document.getElementById('scatterLegend').innerHTML = legend;
}

/* ============================================================
   PETA SEBARAN KLASTER (bubble map berbasis koordinat provinsi)
   ============================================================ */
function projectLatLon(lat, lon) {
  const { lonMin, lonMax, latMin, latMax } = MAP_BOUNDS;
  const w = 780, h = 300;
  const x = ((lon - lonMin) / (lonMax - lonMin)) * w;
  const y = ((latMax - lat) / (latMax - latMin)) * h;
  return { x, y };
}

function renderMap() {
  const r = RESULTS[currentK];
  const w = 780, h = 300;
  const maxMurid = Math.max(...RAW_DATA.map(d => d.murid));

  const dots = r.rows.map(row => {
    const coord = PROV_COORDS[row.provinsi];
    if (!coord) return '';
    const { x, y } = projectLatLon(coord[0], coord[1]);
    const col = TIER_COLOR[row.klaster];
    const raw = RAW_DATA.find(d => d.provinsi === row.provinsi);
    const rad = 4 + Math.sqrt(raw.murid / maxMurid) * 12;
    return `
    <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad.toFixed(1)}" fill="${col.mid}" fill-opacity="0.8"
      stroke="${col.dark}" stroke-width="1.5" style="cursor:pointer"
      onclick="openDetailModal('${row.provinsi.replace(/'/g,"\\'")}')">
      <title>${row.provinsi} — ${row.klaster} (${fmt(raw.murid)} murid)</title>
    </circle>`;
  }).join('');

  const legend = r.labels.map(label => {
    const col = TIER_COLOR[label];
    return `<span class="scatter-legend-item"><span class="dot" style="background:${col.mid}"></span>${label}</span>`;
  }).join('');

  document.getElementById('mapPlot').innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" width="100%" role="img" aria-label="Peta sebaran klaster provinsi di Indonesia">
      <defs>
        <linearGradient id="oceanGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0d3a5c"/>
          <stop offset="100%" stop-color="#0a2c47"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="${w}" height="${h}" rx="10" fill="url(#oceanGrad)"/>
      ${[1,2,3].map(i => `<line x1="0" y1="${(h/4)*i}" x2="${w}" y2="${(h/4)*i}" stroke="rgba(255,255,255,0.06)"/>`).join('')}
      ${[1,2,3,4,5,6].map(i => `<line x1="${(w/7)*i}" y1="0" x2="${(w/7)*i}" y2="${h}" stroke="rgba(255,255,255,0.06)"/>`).join('')}
      ${dots}
    </svg>`;
  document.getElementById('mapLegend').innerHTML = legend;
}
