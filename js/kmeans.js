/* ============================================================
   K-MEANS (deterministik, seeded, tanpa Math.random) supaya
   hasil sama & bisa diverifikasi ulang setiap dijalankan
   ============================================================ */
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function standardize(matrix) {
  const n = matrix.length, d = matrix[0].length;
  const mean = new Array(d).fill(0), std = new Array(d).fill(0);
  for (const row of matrix) for (let j = 0; j < d; j++) mean[j] += row[j];
  for (let j = 0; j < d; j++) mean[j] /= n;
  for (const row of matrix) for (let j = 0; j < d; j++) std[j] += (row[j]-mean[j])**2;
  for (let j = 0; j < d; j++) std[j] = Math.sqrt(std[j]/n) || 1;
  return matrix.map(row => row.map((v,j) => (v-mean[j])/std[j]));
}

function sqDist(a,b) { let s=0; for (let i=0;i<a.length;i++) s += (a[i]-b[i])**2; return s; }
function dist(a,b) { return Math.sqrt(sqDist(a,b)); }

function kmeansPPInit(X, k, rng) {
  const n = X.length;
  const centroids = [];
  centroids.push(X[Math.floor(rng()*n)].slice());
  while (centroids.length < k) {
    const d2 = X.map(x => Math.min(...centroids.map(c => sqDist(x,c))));
    const sum = d2.reduce((a,b)=>a+b,0);
    if (sum === 0) { centroids.push(X[Math.floor(rng()*n)].slice()); continue; }
    let r = rng()*sum, idx = 0;
    for (; idx < n; idx++) { r -= d2[idx]; if (r <= 0) break; }
    centroids.push(X[Math.min(idx,n-1)].slice());
  }
  return centroids;
}

function kmeansOnce(X, k, seed) {
  const rng = mulberry32(seed);
  let centroids = kmeansPPInit(X, k, rng);
  let assignments = new Array(X.length).fill(0);
  for (let iter = 0; iter < 300; iter++) {
    let changed = false;
    for (let i = 0; i < X.length; i++) {
      let best = 0, bestD = Infinity;
      for (let c = 0; c < k; c++) {
        const d2 = sqDist(X[i], centroids[c]);
        if (d2 < bestD) { bestD = d2; best = c; }
      }
      if (assignments[i] !== best) { assignments[i] = best; changed = true; }
    }
    const sums = Array.from({length:k}, () => new Array(X[0].length).fill(0));
    const counts = new Array(k).fill(0);
    for (let i = 0; i < X.length; i++) {
      counts[assignments[i]]++;
      for (let j = 0; j < X[0].length; j++) sums[assignments[i]][j] += X[i][j];
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] === 0) {
        // re-seed cluster kosong ke titik terjauh dari centroid-nya sendiri
        let far = 0, farD = -1;
        for (let i = 0; i < X.length; i++) {
          const d2 = sqDist(X[i], centroids[assignments[i]]);
          if (d2 > farD) { farD = d2; far = i; }
        }
        centroids[c] = X[far].slice();
      } else {
        centroids[c] = sums[c].map(v => v/counts[c]);
      }
    }
    if (!changed && iter > 0) break;
  }
  let sse = 0;
  for (let i = 0; i < X.length; i++) sse += sqDist(X[i], centroids[assignments[i]]);
  return { assignments, centroids, sse };
}

function kmeansBest(X, k, restarts=30) {
  let best = null;
  for (let s = 1; s <= restarts; s++) {
    const res = kmeansOnce(X, k, s * 7919 + k * 104729);
    if (!best || res.sse < best.sse) best = res;
  }
  return best;
}

function silhouette(X, assignments, k) {
  const n = X.length;
  const scores = new Array(n).fill(0);
  const byCluster = Array.from({length:k}, () => []);
  assignments.forEach((c,i) => byCluster[c].push(i));
  for (let i = 0; i < n; i++) {
    const own = assignments[i];
    const ownMembers = byCluster[own].filter(j => j !== i);
    let a = 0;
    if (ownMembers.length === 0) { scores[i] = 0; continue; }
    for (const j of ownMembers) a += dist(X[i], X[j]);
    a /= ownMembers.length;
    let b = Infinity;
    for (let c = 0; c < k; c++) {
      if (c === own || byCluster[c].length === 0) continue;
      let s = 0;
      for (const j of byCluster[c]) s += dist(X[i], X[j]);
      s /= byCluster[c].length;
      if (s < b) b = s;
    }
    scores[i] = (b - a) / Math.max(a,b);
  }
  return scores;
}

function daviesBouldin(X, assignments, centroids, k) {
  const scatter = new Array(k).fill(0);
  const counts = new Array(k).fill(0);
  for (let i = 0; i < X.length; i++) {
    scatter[assignments[i]] += dist(X[i], centroids[assignments[i]]);
    counts[assignments[i]]++;
  }
  for (let c = 0; c < k; c++) scatter[c] = counts[c] ? scatter[c]/counts[c] : 0;
  let total = 0;
  for (let i = 0; i < k; i++) {
    let maxR = -Infinity;
    for (let j = 0; j < k; j++) {
      if (i === j) continue;
      const d = dist(centroids[i], centroids[j]);
      const r = d === 0 ? 0 : (scatter[i]+scatter[j]) / d;
      if (r > maxR) maxR = r;
    }
    total += maxR;
  }
  return total / k;
}

/* ============================================================
   Precompute hasil clustering untuk k = 2,3,4,5 sekali saat load
   ============================================================ */
function computeForK(k) {
  const rawMatrix = RAW_DATA.map(d => [d.sekolah, d.guru, d.murid]);
  const Xstd = standardize(rawMatrix);
  const { assignments, centroids, sse } = kmeansBest(Xstd, k);
  const silScores = silhouette(Xstd, assignments, k);
  const db = daviesBouldin(Xstd, assignments, centroids, k);

  // rank cluster index by composite (mean standardized centroid) ascending -> label rendah ke tinggi
  const composite = centroids.map(c => c.reduce((a,b)=>a+b,0)/c.length);
  const order = composite.map((v,i)=>i).sort((a,b)=>composite[a]-composite[b]);
  const labels = labelsForK(k);
  const labelByClusterIdx = {};
  order.forEach((clusterIdx, rank) => { labelByClusterIdx[clusterIdx] = labels[rank]; });

  const rows = RAW_DATA.map((d, i) => ({
    provinsi: d.provinsi,
    sekolah: d.sekolah,
    guru: d.guru,
    murid: d.murid,
    klaster: labelByClusterIdx[assignments[i]],
    silhouette: silScores[i]
  }));

  const overallSil = silScores.reduce((a,b)=>a+b,0) / silScores.length;

  const perLabel = {};
  labels.forEach(l => { perLabel[l] = { count:0, sekolah:0, guru:0, murid:0, sil:0 }; });
  rows.forEach(r => {
    const p = perLabel[r.klaster];
    p.count++; p.sekolah += r.sekolah; p.guru += r.guru; p.murid += r.murid; p.sil += r.silhouette;
  });
  labels.forEach(l => {
    const p = perLabel[l];
    if (p.count) { p.sekolah = Math.round(p.sekolah/p.count); p.guru = Math.round(p.guru/p.count); p.murid = Math.round(p.murid/p.count); p.sil = p.sil/p.count; }
  });

  return { k, labels, rows, overallSil, db, perLabel, sse };
}

const RESULTS = {};
[2,3,4,5].forEach(k => { RESULTS[k] = computeForK(k); });

// Matriks terstandardisasi (sama untuk semua k, dipakai ulang oleh PCA)
const GLOBAL_XSTD = standardize(RAW_DATA.map(d => [d.sekolah, d.guru, d.murid]));
