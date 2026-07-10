/* ============================================================
   Koordinat perkiraan (lintang, bujur) tiap provinsi — dipakai
   untuk memposisikan titik pada peta sebaran klaster.
   Sumber: koordinat umum ibu kota provinsi (akurasi cukup untuk
   peta bubble, bukan untuk analisis GIS presisi tinggi).
   ============================================================ */
const PROV_COORDS = {
  "Aceh": [5.55, 95.32],
  "Sumatera Utara": [3.59, 98.67],
  "Sumatera Barat": [-0.95, 100.35],
  "Riau": [0.51, 101.45],
  "Jambi": [-1.61, 103.61],
  "Sumatera Selatan": [-2.99, 104.76],
  "Bengkulu": [-3.79, 102.26],
  "Lampung": [-5.45, 105.27],
  "Kepulauan Bangka Belitung": [-2.13, 106.11],
  "Kepulauan Riau": [0.92, 104.45],
  "DKI Jakarta": [-6.21, 106.85],
  "Jawa Barat": [-6.91, 107.61],
  "Jawa Tengah": [-6.97, 110.42],
  "DI Yogyakarta": [-7.80, 110.36],
  "Jawa Timur": [-7.25, 112.75],
  "Banten": [-6.12, 106.15],
  "Bali": [-8.65, 115.22],
  "Nusa Tenggara Barat": [-8.58, 116.12],
  "Nusa Tenggara Timur": [-10.17, 123.61],
  "Kalimantan Barat": [-0.03, 109.34],
  "Kalimantan Tengah": [-2.21, 113.92],
  "Kalimantan Selatan": [-3.45, 114.83],
  "Kalimantan Timur": [-0.50, 117.15],
  "Kalimantan Utara": [2.84, 117.37],
  "Sulawesi Utara": [1.49, 124.85],
  "Sulawesi Tengah": [-0.90, 119.87],
  "Sulawesi Selatan": [-5.15, 119.43],
  "Sulawesi Tenggara": [-3.97, 122.52],
  "Gorontalo": [0.54, 123.06],
  "Sulawesi Barat": [-2.68, 118.89],
  "Maluku": [-3.70, 128.18],
  "Maluku Utara": [0.75, 127.50],
  "Papua Barat": [-0.86, 134.06],
  "Papua Barat Daya": [-0.87, 131.25],
  "Papua": [-2.53, 140.72],
  "Papua Selatan": [-8.50, 140.40],
  "Papua Tengah": [-3.37, 135.48],
  "Papua Pegunungan": [-4.10, 138.94]
};

// Batas kira-kira wilayah Indonesia, dipakai untuk memproyeksikan
// lintang/bujur ke koordinat SVG (proyeksi equirectangular sederhana)
const MAP_BOUNDS = { lonMin: 94.5, lonMax: 141.5, latMin: -11.5, latMax: 6.5 };
