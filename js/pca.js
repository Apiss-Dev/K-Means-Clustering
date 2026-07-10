/* ============================================================
   PCA (Principal Component Analysis) sederhana
   Dipakai untuk memproyeksikan 3 fitur (sekolah, guru, murid)
   yang sudah distandardisasi menjadi 2 dimensi agar bisa
   divisualisasikan sebagai scatter plot.
   ============================================================ */

// Algoritma Jacobi eigenvalue untuk matriks simetris n x n (di sini n=3)
function jacobiEigen(matrix, maxIter = 100, tol = 1e-10) {
  const n = matrix.length;
  const A = matrix.map(row => row.slice());
  const V = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));

  for (let iter = 0; iter < maxIter; iter++) {
    let p = 0, q = 1, max = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(A[i][j]) > max) { max = Math.abs(A[i][j]); p = i; q = j; }
      }
    }
    if (max < tol) break;

    const app = A[p][p], aqq = A[q][q], apq = A[p][q];
    const phi = 0.5 * Math.atan2(2 * apq, aqq - app);
    const c = Math.cos(phi), s = Math.sin(phi);

    const newApp = c*c*app - 2*s*c*apq + s*s*aqq;
    const newAqq = s*s*app + 2*s*c*apq + c*c*aqq;
    A[p][p] = newApp; A[q][q] = newAqq; A[p][q] = 0; A[q][p] = 0;

    for (let i = 0; i < n; i++) {
      if (i !== p && i !== q) {
        const aip = A[i][p], aiq = A[i][q];
        A[i][p] = c*aip - s*aiq; A[p][i] = A[i][p];
        A[i][q] = s*aip + c*aiq; A[q][i] = A[i][q];
      }
    }
    for (let i = 0; i < n; i++) {
      const vip = V[i][p], viq = V[i][q];
      V[i][p] = c*vip - s*viq;
      V[i][q] = s*vip + c*viq;
    }
  }

  const eigenvalues = A.map((row, i) => row[i]);
  return { eigenvalues, eigenvectors: V }; // kolom V[.][j] adalah eigenvector ke-j
}

function computePCA2D(X) {
  const n = X.length, d = X[0].length;
  const cov = Array.from({ length: d }, () => new Array(d).fill(0));
  for (const row of X) {
    for (let i = 0; i < d; i++) for (let j = 0; j < d; j++) cov[i][j] += row[i] * row[j];
  }
  for (let i = 0; i < d; i++) for (let j = 0; j < d; j++) cov[i][j] /= n;

  const { eigenvalues, eigenvectors } = jacobiEigen(cov);
  const order = eigenvalues.map((v, i) => i).sort((a, b) => eigenvalues[b] - eigenvalues[a]);
  const [i1, i2] = order;
  const vec1 = eigenvectors.map(row => row[i1]);
  const vec2 = eigenvectors.map(row => row[i2]);

  const totalVar = eigenvalues.reduce((a, b) => a + b, 0) || 1;
  const varExplained = [eigenvalues[i1] / totalVar, eigenvalues[i2] / totalVar];

  const points = X.map(row => ({
    x: row[0]*vec1[0] + row[1]*vec1[1] + row[2]*vec1[2],
    y: row[0]*vec2[0] + row[1]*vec2[1] + row[2]*vec2[2]
  }));

  return { points, varExplained };
}
