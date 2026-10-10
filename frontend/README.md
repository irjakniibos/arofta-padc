# Frontend SIM Layanan Psikologi AROFTA PADC

Next.js 15 (App Router, JavaScript) + Tailwind CSS 4. Terhubung ke backend Express lewat proxy `/api`.

## Menjalankan di laptop

Backend harus sudah berjalan (`npm run dev` di folder `backend`, port 5000).

```bash
cd frontend
npm install
copy .env.example .env.local     # Linux/Mac: cp .env.example .env.local
npm run dev                      # http://localhost:3000
```

Di `.env` **backend**, pastikan `TRUST_PROXY=1` (request dari browser masuk lewat proxy Next.js).

## Konfigurasi (`.env.local`)

| Variabel | Fungsi |
|---|---|
| `BACKEND_URL` | Alamat backend, default `http://localhost:5000` |
| `NEXT_PUBLIC_API_PREFIX` | Harus sama dengan `API_BASE_PATH` backend (`/api/v1`) |
| `NEXT_PUBLIC_BASE_PATH` | Isi `/arofta` bila web dijalankan di subfolder; kosong bila di root domain |
| `AUTH_COOKIE_NAME` | Harus sama dengan `COOKIE_NAME` backend |

## Cara kerja koneksi ke backend

- Browser memanggil `/api/v1/...` di domain frontend; Next.js meneruskannya ke backend (`next.config.mjs`).
  Frontend & backend jadi satu origin, sehingga cookie login httpOnly bekerja tanpa pengaturan CORS.
- Semua pemanggilan API dari komponen lewat `src/lib/api.js` (tidak ada URL ditulis langsung di komponen).
- Halaman publik (beranda, layanan, tim psikolog) dirender di server lewat `src/lib/server-api.js`.
- `src/middleware.js` mengarahkan pengunjung yang belum login ke `/masuk`; role diperiksa `DashboardShell`,
  dan backend tetap memeriksa hak akses di setiap request.

## Struktur

```
src/
├── app/
│   ├── (publik)/      beranda, layanan, tim-psikolog, jadwal (kalender publik)
│   ├── (auth)/        masuk, daftar, lupa-password, reset-password
│   ├── klien/         area klien
│   ├── psikolog/      area psikolog
│   └── admin/         area admin & super admin
├── components/        ui (Button, Field, Alert, Badge), layout, kalender, dashboard
└── lib/               config, api, auth-context, format, nav, use-api
```

## Desain

- Warna dari logo resmi AROFTA: ungu `#7C51A1`, merah centang `#ED1B23` (hanya untuk tanda centang & peringatan).
- Huruf: Plus Jakarta Sans (antarmuka) dan Newsreader (judul halaman publik), di-host sendiri lewat Fontsource.
- Ciri khas beranda: potongan psikogram seperti pada laporan hasil AROFTA.

## Produksi

```bash
npm run build
npm start          # port 3000, letakkan di belakang Nginx (lihat README backend bagian Deploy)
```
