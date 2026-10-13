
# Review Intelligence

### AI-Powered E-Commerce Review Analytics

Review Intelligence adalah project capstone yang berfokus pada analisis ulasan produk e-commerce melalui ringkasan ulasan, klasifikasi sentimen, dan dashboard analitik interaktif.

Project ini bertujuan membantu pengguna memahami persepsi pelanggan, mengenali pola apresiasi dan keluhan, serta mengeksplorasi hasil analisis ulasan secara lebih terstruktur.

## Project Overview

Analisis ulasan pelanggan secara manual dapat memerlukan waktu, terutama ketika jumlah ulasan besar dan beragam. Review Intelligence dikembangkan untuk membantu proses tersebut melalui pengolahan data ulasan dan penyajian informasi dalam dashboard.

Project ini mencakup AI Agent untuk menghasilkan ringkasan dan klasifikasi sentimen, serta dashboard untuk mengeksplorasi distribusi rating, sentimen, kategori produk, dan insight ulasan.

## Features

### AI Review Summarization
Menghasilkan ringkasan ulasan dalam bahasa Indonesia yang ringkas, koheren, dan mudah dipahami berdasarkan isi ulasan pelanggan.

### Sentiment Analysis
Mengelompokkan sentimen ulasan ke dalam tiga kategori:

- **Positive** — menunjukkan kepuasan atau pengalaman positif.
- **Neutral** — bersifat informatif atau tidak menunjukkan sentimen yang kuat.
- **Negative** — menunjukkan keluhan atau ketidakpuasan.

### Interactive Analytics Dashboard
Dashboard menyediakan beberapa bagian utama:

- **Overview** — ringkasan metrik ulasan.
- **Product Reviews** — tabel ulasan dengan pencarian, filter, pengurutan, dan pagination.
- **Sentiment Analysis** — visualisasi distribusi sentimen dan perbandingan rating berdasarkan kategori produk.
- **AI Insights** — ringkasan dan rekomendasi tindak lanjut yang ditampilkan pada dashboard.

Dashboard juga menyediakan filter periode, kategori produk, dan sentimen untuk membantu eksplorasi data.

## Dataset

Repository ini menyertakan dataset ulasan produk dalam format CSV:

- `laptop_online_review.csv` — dataset ulasan produk.
- `review_data.js` — data ulasan yang digunakan oleh dashboard.
- `review_data.json` — data ulasan dalam format JSON.

Dataset CSV memiliki kolom berikut:

| Column | Description |
|---|---|
| `Unnamed: 0` | Kolom indeks dari dataset sumber. |
| `Product_name` | Nama produk. |
| `Review` | Teks ulasan pelanggan. |
| `Rating` | Rating produk pada skala 1–5. |

**Dataset source:** [TODO: tambahkan tautan sumber dataset asli]

Pastikan sumber dataset dan ketentuan penggunaannya dicantumkan dengan benar.

## Tech Stack

- HTML
- CSS
- JavaScript
- Chart.js
- CSV and JSON for review data

Chart.js digunakan untuk menyajikan visualisasi analitik pada dashboard.

## Getting Started

Dashboard dibuat menggunakan HTML, CSS, dan JavaScript, sehingga dapat dicoba secara lokal melalui browser.

### 1. Clone the Repository

```bash
git clone https://github.com/eferdee/ecommerce-review-analyzer.git
cd ecommerce-review-analyzer
```

### 2. Run the Dashboard

Pastikan file berikut berada di direktori yang sama:

- `dashboard.html`
- `review_data.js`
- `review_data.json`

Buka `dashboard.html` melalui browser untuk melihat dashboard.

Jika browser membatasi pemuatan file lokal, jalankan server lokal sederhana dari direktori repository:

```bash
python -m http.server 8000
```

Kemudian buka:

```text
http://localhost:8000/dashboard.html
```

Dashboard memuat Chart.js melalui CDN, sehingga koneksi internet diperlukan untuk memuat library tersebut.

## Project Access

- **GitHub Repository:** https://github.com/eferdee/ecommerce-review-analyzer
- **Local Dashboard:** Jalankan `dashboard.html` mengikuti petunjuk di atas.
- **Live Demo:** Belum tersedia.
- **IBM Bob Project:** Tautan berbagi akan ditambahkan jika tersedia.

## Screenshots

Screenshot dashboard dan hasil pengujian AI Agent dapat ditambahkan di folder `screenshots/`.

Contoh struktur:

```text
review-intelligence/
├── dashboard.html
├── laptop_online_review.csv
├── review_data.js
├── review_data.json
├── screenshots/
│   ├── dashboard-overview.png
│   └── ai-agent-test.png
└── README.md
```

Setelah screenshot ditambahkan, tampilkan di bagian ini:

```markdown
![Dashboard Overview](screenshots/dashboard-overview.png)
```

Gunakan screenshot asli dari project agar reviewer dapat melihat hasil implementasi.

## Limitations

- Dashboard saat ini dijalankan secara lokal dan belum tersedia sebagai demo publik.
- Hasil ringkasan dan klasifikasi sentimen bergantung pada data serta metode analisis yang digunakan.
- Ringkasan, rekomendasi, dan metrik pada dashboard perlu ditinjau terhadap sumber data untuk memastikan konsistensinya.

## Future Improvements

- Mengintegrasikan AI Agent secara langsung dengan dashboard.
- Menambahkan evaluasi kualitas ringkasan dan klasifikasi sentimen.
- Mengembangkan identifikasi tema keluhan dan apresiasi secara otomatis.
- Men-deploy dashboard agar dapat diakses reviewer secara daring.

## Author

**M. Farid Saputra**

Capstone Project — Review Intelligence
