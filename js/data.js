/* ============================================================
   DATA ASLI — 38 provinsi (Kemendikdasmen/BPS 2025/2026)
   sama persis dengan sumber Data_Pendidikan.xlsx
   ============================================================ */
const RAW_DATA = [
{"provinsi":"Aceh","sekolah":553,"guru":14407,"murid":142827},
{"provinsi":"Sumatera Utara","sekolah":1078,"guru":24581,"murid":391554},
{"provinsi":"Sumatera Barat","sekolah":359,"guru":2326,"murid":161181},
{"provinsi":"Riau","sekolah":496,"guru":12643,"murid":183820},
{"provinsi":"Jambi","sekolah":257,"guru":5951,"murid":85441},
{"provinsi":"Sumatera Selatan","sekolah":620,"guru":15587,"murid":226406},
{"provinsi":"Bengkulu","sekolah":153,"guru":4375,"murid":56769},
{"provinsi":"Lampung","sekolah":536,"guru":12727,"murid":185714},
{"provinsi":"Kepulauan Bangka Belitung","sekolah":83,"guru":1962,"murid":34268},
{"provinsi":"Kepulauan Riau","sekolah":175,"guru":3905,"murid":60034},
{"provinsi":"DKI Jakarta","sekolah":510,"guru":7798,"murid":186461},
{"provinsi":"Jawa Barat","sekolah":1858,"guru":45496,"murid":870358},
{"provinsi":"Jawa Tengah","sekolah":874,"guru":26293,"murid":467905},
{"provinsi":"DI Yogyakarta","sekolah":179,"guru":4076,"murid":63238},
{"provinsi":"Jawa Timur","sekolah":1511,"guru":34645,"murid":559378},
{"provinsi":"Banten","sekolah":618,"guru":6988,"murid":228323},
{"provinsi":"Bali","sekolah":158,"guru":5831,"murid":87283},
{"provinsi":"Nusa Tenggara Barat","sekolah":389,"guru":10551,"murid":124856},
{"provinsi":"Nusa Tenggara Timur","sekolah":624,"guru":17167,"murid":195689},
{"provinsi":"Kalimantan Barat","sekolah":477,"guru":8985,"murid":135912},
{"provinsi":"Kalimantan Tengah","sekolah":252,"guru":1184,"murid":58597},
{"provinsi":"Kalimantan Selatan","sekolah":212,"guru":5201,"murid":71349},
{"provinsi":"Kalimantan Timur","sekolah":240,"guru":5786,"murid":87058},
{"provinsi":"Kalimantan Utara","sekolah":73,"guru":1511,"murid":2429},
{"provinsi":"Sulawesi Utara","sekolah":227,"guru":1281,"murid":61282},
{"provinsi":"Sulawesi Tengah","sekolah":239,"guru":5918,"murid":77820},
{"provinsi":"Sulawesi Selatan","sekolah":617,"guru":4380,"murid":225822},
{"provinsi":"Sulawesi Tenggara","sekolah":318,"guru":9395,"murid":13362},
{"provinsi":"Gorontalo","sekolah":71,"guru":311,"murid":30225},
{"provinsi":"Sulawesi Barat","sekolah":95,"guru":2478,"murid":30120},
{"provinsi":"Maluku","sekolah":295,"guru":6650,"murid":58810},
{"provinsi":"Maluku Utara","sekolah":219,"guru":3940,"murid":43460},
{"provinsi":"Papua Barat","sekolah":71,"guru":1410,"murid":18017},
{"provinsi":"Papua Barat Daya","sekolah":82,"guru":1501,"murid":14945},
{"provinsi":"Papua","sekolah":119,"guru":2382,"murid":35622},
{"provinsi":"Papua Selatan","sekolah":40,"guru":932,"murid":14432},
{"provinsi":"Papua Tengah","sekolah":60,"guru":1162,"murid":18577},
{"provinsi":"Papua Pegunungan","sekolah":72,"guru":907,"murid":15633}
];

/* ============================================================
   Label & warna per tingkatan (skala tetap 5 tingkat, dipotong
   sesuai k agar label & warna konsisten di semua pilihan k)
   ============================================================ */
const TIER_SCALE = ['Tertinggal', 'Kurang Berkembang', 'Sedang Berkembang', 'Berkembang Pesat', 'Maju'];
const TIER_COLOR = {
  'Tertinggal':        { dark:'#8b1a1a', mid:'#dc3545', light:'#fde8e8', border:'#f5b8b8' },
  'Kurang Berkembang': { dark:'#9a5b0a', mid:'#f59e0b', light:'#fef3c7', border:'#f2d49a' },
  'Sedang Berkembang': { dark:'#0d4f8c', mid:'#1976d2', light:'#cce0f5', border:'#93c5e8' },
  'Berkembang Pesat':  { dark:'#0f766e', mid:'#14b8a6', light:'#ccfbf1', border:'#8fd8ce' },
  'Maju':              { dark:'#1a6b3c', mid:'#28a745', light:'#d4edda', border:'#a8d5b7' }
};
// Untuk tiap k, ambil subset tier secara merata dari skala 5-tingkat di atas
function labelsForK(k) {
  if (k === 5) return TIER_SCALE.slice();
  if (k === 2) return ['Tertinggal', 'Maju'];
  if (k === 3) return ['Tertinggal', 'Sedang Berkembang', 'Maju'];
  if (k === 4) return ['Tertinggal', 'Kurang Berkembang', 'Sedang Berkembang', 'Maju'];
  return TIER_SCALE.slice(0, k);
}

const REKO_TEXT = {
  'Maju': [
    'Fokus pada peningkatan kualitas dan standar kompetensi guru, bukan penambahan jumlah',
    'Pemerataan distribusi murid antarsekolah agar tidak terjadi penumpukan',
    'Modernisasi kurikulum dan fasilitas pembelajaran berbasis teknologi',
    'Menjadi provinsi percontohan (benchmark) bagi klaster lainnya'
  ],
  'Berkembang Pesat': [
    'Konsolidasi capaian sambil mempertahankan momentum pertumbuhan sekolah dan tenaga pengajar',
    'Penguatan sistem penjaminan mutu agar sejajar dengan klaster paling maju',
    'Investasi lanjutan pada fasilitas dan digitalisasi pembelajaran',
    'Pemetaan kesenjangan antarwilayah dalam provinsi untuk pemerataan internal'
  ],
  'Sedang Berkembang': [
    'Perluasan kapasitas infrastruktur SMA secara terencana di wilayah padat penduduk',
    'Redistribusi guru ke daerah yang rasio guru-murid belum ideal',
    'Dukungan anggaran afirmasi untuk percepatan pembangunan sekolah baru',
    'Peningkatan kualifikasi dan sertifikasi tenaga pendidik'
  ],
  'Kurang Berkembang': [
    'Percepatan pembangunan unit sekolah baru di kantong-kantong kekurangan akses',
    'Rekrutmen dan penempatan guru tambahan secara bertahap dan terarah',
    'Peningkatan anggaran operasional sekolah dan beasiswa transisi',
    'Kolaborasi dengan provinsi tetangga yang lebih maju untuk transfer praktik baik'
  ],
  'Tertinggal': [
    'Pembangunan sekolah baru secara masif sebagai prioritas nasional',
    'Program penempatan guru afirmasi khusus wilayah 3T',
    'Peningkatan anggaran pendidikan signifikan dan berkelanjutan',
    'Program beasiswa dan insentif untuk meningkatkan partisipasi peserta didik'
  ]
};
