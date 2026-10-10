# CLAUDE.md — Capstone AROFTA PADC

Konteks proyek untuk Claude Code. Baca sampai habis sebelum mengubah apa pun.

## Tentang proyek dan pemilik

- Pemilik: Irza (Irza Yaumil Syahrar), mahasiswa Informatika UMY, NIM 20230140094.
- Judul Capstone: Pengembangan Sistem Informasi Manajemen Layanan Psikologi Berbasis Web pada AROFTA PADC (Psychological Assessment and Development Center, Kartasura, Sukoharjo).
- Target: sistem yang benar-benar dipakai klien AROFTA, bukan sekadar demo.
- Frontend sebenarnya tugas teman satu tim. Irza mengerjakan backend dan frontend sekaligus karena wireframe teman (dibuat dengan AI) "salah total". Wireframe itu tidak dipakai.
- Gaya komunikasi: Bahasa Indonesia santai, singkat, langsung ke inti. Tanyakan dulu kalau ada keputusan penting. Kalau Irza minta "jawab singkat", jawab singkat.
- Dokumen akademik (laporan, black-box, daftar revisi): .docx, Times New Roman, gaya akademik.
- Prioritas Irza: aplikasi sesuai keinginan dulu, baru dokumen/laporan.

## Lingkungan di laptop Irza (Windows)

- MySQL lewat MySQL Workbench, port 3307 (`DB_PORT=3307`), user aplikasi `arofta_app`, database `arofta_padc` dan `arofta_padc_test`.
- Nilai `.env` yang mengandung `#` wajib diberi tanda kutip, contoh `DB_PASSWORD="..."`.
- LibreOffice terpasang: `SOFFICE_PATH="C:\Program Files\LibreOffice\program\soffice.exe"`. Tanpa LibreOffice, laporan jatuh ke .docx (fallback).
- SMTP masih kosong. Selama `SMTP_HOST` kosong, email dicetak di terminal backend: `[EMAIL-DEV] Ke ... | Subjek ...` lalu `Tautan: <url>`. Untuk email sungguhan: Gmail + App Password (`SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_SECURE=false`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`).
- Jangan pernah menampilkan isi `JWT_SECRET`, `DB_PASSWORD`, atau `SEED_SUPERADMIN_PASSWORD` di chat. `.env` dan `.env.local` tidak boleh di-commit atau di-zip.

## Git

- Repo git lokal di root (`main`), dibuat 10 Oktober 2026. Belum ada remote GitHub (Irza akan memberi tahu bila akunnya sudah bisa dipakai).
- `.gitignore` root mengecualikan `node_modules/`, `.env`, `.env.local`. Line ending dinormalkan LF lewat `.gitattributes`.
- Commit atas nama Irza (`irzayaumilsyahrar55@gmail.com`). Commit hanya bila diminta atau di akhir pekerjaan yang sudah lolos test.

## Struktur folder

```
<root>/
├── CLAUDE.md
├── backend/    Node.js + Express 4 + Sequelize 6 + MySQL (REST API)
└── frontend/   Next.js 15.5 App Router (JavaScript) + Tailwind v4
```

## Menjalankan

Backend (`backend/`):

```
npm install
npm run db:migrate      # 31 tabel
npm run db:seed         # master data, super admin dari .env, data dummy
npm run dev             # http://localhost:5000/api/v1
npm run db:reset        # undo semua migration + migrate + seed
npm test                # Jest + Supertest, 46 test, DB arofta_padc_test
npm run lint
npm run template:check  # cek placeholder template Word
npm run backup          # mysqldump ke storage/backup (KN-09, dijadwalkan lewat cron server)
node scripts/generate-postman.js   # buat ulang koleksi Postman (143 endpoint)
```

Frontend (`frontend/`):

```
npm install
npm run dev             # http://localhost:3000
npm run build && npm start
```

`.env.local` frontend: `BACKEND_URL=http://localhost:5000`, `NEXT_PUBLIC_API_PREFIX=/api/v1`, `NEXT_PUBLIC_BASE_PATH=`, `AUTH_COOKIE_NAME=arofta_token`.

Akun dummy (password `Password123`): `admin@arofta.id`, `psikolog1@arofta.id`, `psikolog2@arofta.id`, `klien1@mail.com`, `klien2@mail.com`. Super Admin: `superadmin@arofta.id`, password dari `SEED_SUPERADMIN_PASSWORD`.

## Kebutuhan (laporan Capstone 1 + daftar revisi v3)

- Istilah "Direksi" di laporan = role Admin di aplikasi.
- KF-01 s.d. KF-17 ada di laporan Capstone 1 (Tabel 2.5). KF-18 s.d. KF-27 ditambahkan lewat `Daftar_Revisi_Laporan_Capstone1_DB_v3.docx`:
  - KF-01 form pendaftaran online, KF-02 klien pilih jadwal, KF-03 Direksi alokasi psikolog, KF-04 data klien terpusat, KF-05 monitoring status asesmen, KF-06 status Terdaftar/Berjalan/Selesai, KF-07 dashboard statistik, KF-08 pengingat jadwal ke klien, KF-09 notifikasi jadwal ke psikolog, KF-10 pembayaran + fee, KF-11 laporan dari template, KF-12 laporan PDF otomatis, KF-13 klien unduh laporan, KF-14 penyimpanan laporan terpusat, KF-15 Direksi input tautan sesi, KF-16 tautan dikirim via email + dashboard, KF-17 notifikasi berisi tautan sebelum sesi.
  - KF-18 slot jadwal psikolog, KF-19 layanan/harga/tarif fee, KF-20 pengeluaran + laporan keuangan, KF-21 kelola/unggah template, KF-22 rekening + link Google Form, KF-23 multi-profil (anak), KF-24 reset password via email, KF-25 Anamnesis/Observasi/SOAP, KF-26 ulasan, KF-27 kalender jadwal.
- KN-01 s.d. KN-09 di Tabel 2.6 (hash password, HTTPS, RBAC laporan, responsif, umpan balik visual, muat ≤5 detik, render PDF tidak menghambat, uptime 99%, backup berkala). Revisi v3 menambah KN keamanan SOP (brute force, validasi, upload, akses file, payload 10 KB, pagination).

## Keputusan yang sudah disepakati Irza (jangan diubah tanpa bertanya)

1. Pembayaran: transfer manual. Bukti transfer lewat Google Form, tidak disimpan di DB. Web menampilkan rekening + link form. Klien menekan "Saya sudah transfer", Admin memverifikasi (Lunas / Ditolak dengan alasan). Tagihan lewat batas waktu kedaluwarsa otomatis.
2. Laporan hasil: 4 template Word (TES_ANAK, MINAT_BAKAT, REKRUTMEN, PSIKOLOGI_UMUM). Psikolog mengisi lewat form (psikogram skala + teks/pilihan). Admin bisa upload template Word baru (versi naik, file lama diarsipkan).
3. PDF: docxtemplater mengisi .docx lalu LibreOffice headless (antrean) mengonversi ke PDF. Fallback .docx.
4. Formulir intake dan catatan klinis detail mengikuti formulir kertas klinik.
5. ORM Sequelize. Perubahan struktur tabel selalu lewat migration baru, bukan diubah di Workbench.
6. Ulasan klien (KF-26): rating 1–5 + komentar setelah sesi selesai, tampil di profil psikolog dengan nama disamarkan, Admin bisa menyembunyikan.
7. Kalender (KF-27) = kalender internal, bukan sinkronisasi Google Calendar.
8. Tema: ungu `#7C51A1` dan merah centang `#ED1B23` (merah hanya untuk centang/psikogram dan peringatan). Tampilan web psikolog profesional, tidak bergaya AI: tanpa pemisah titik tengah/em-dash dekoratif, tanpa label kapital semua, tanpa deretan kartu SaaS seragam. Font Plus Jakarta Sans + Newsreader (Fontsource), ikon lucide-react. Elemen khas beranda: psikogram dengan centang yang tergambar.

## Kepatuhan SOP Capstone (wajib dijaga)

- Keamanan: rate limit login 10 gagal/15 menit per IP + akun terkunci 15 menit setelah 5x gagal, anti SQL injection (ORM/replacements), validasi frontend dan backend (express-validator, `req.validated` = matchedData), sanitizer global, password ter-masking, upload .docx saja maks 2 MB 1 file, file sensitif hanya lewat endpoint berotorisasi.
- bcrypt, JWT di cookie httpOnly, Helmet, HPP, payload 10 KB, `API_RATE_LIMIT` (default 1500 / 15 menit).
- Tidak ada `SELECT *` tanpa pagination (maks 50 per halaman).
- Tidak ada hardcode URL, secret, maupun role. Role/status dari `backend/src/config/constants.js` dan `frontend/src/lib/config.js`. Semua URL dari `.env`. Mendukung subdirectory (`API_BASE_PATH`, `NEXT_PUBLIC_BASE_PATH`).
- Arsitektur: routes → validators → controllers → services → models.
- UI responsif dengan loading state dan error state (tombol "Coba lagi").
- CRUD lengkap dan testing yang dapat diulang.

## Backend — ringkasan teknis

- Express 4 (bukan 5, karena `req.query` read-only di Express 5).
- `TRUST_PROXY=1` (request lewat proxy Next.js / nginx).
- `database/schema.sql` (30 tabel) dijalankan migration `20261009000001-initial-schema.js`; `20261009000002-ulasan.js` menambah `ulasan` → 31 tabel. Migration down juga drop `ulasan` dan `sequelize_data`.
- `database/arofta_padc_v3_workbench.sql`: siap impor di Workbench.
- Seeder: `01-master-data`, `02-super-admin`, `03-dummy-data`.
- Pengaturan bawaan: alamat "Kauman RT 04/09, Ngadirejo, Kartasura, Sukoharjo", WhatsApp 082228885529, email arofta.padc@gmail.com.
- Aturan bisnis: status sesi Terdaftar → Berjalan → Selesai, atau → Batal. Sesi dimulai hanya bila Lunas dan paling cepat 1 jam sebelum jadwal. Sesi Selesai → fee otomatis. Laporan Final terkunci, hanya Admin bisa membuka kembali. Slot terpesan → 409; slot kembali Tersedia bila sesi batal. Super Admin mewarisi semua hak Admin + kelola akun, audit log, backup.
- Cron (`src/jobs/index.js`): pengingat jadwal dan kedaluwarsa tagihan tiap 15 menit, pembersihan token 02.00.
- Postman: `postman/AROFTA_PADC_API.postman_collection.json` (143 endpoint).

## Frontend — ringkasan teknis

- Next.js 15.5 App Router, JavaScript, Tailwind v4 (token di `@theme` pada `src/app/globals.css`, utilitas `rounded-control`, `rounded-panel`).
- `next.config.mjs`: rewrites `/api/v1/*` → `BACKEND_URL`, basePath, header keamanan.
- `src/middleware.js` menjaga `/klien`, `/psikolog`, `/admin`; `DashboardShell` memeriksa role; halaman Super Admin dibungkus `components/auth/SuperAdminOnly.js`.
- `lib/format.js`: pakai `isoLokal` untuk tanggal lokal, jangan `toISOString().slice(0,10)` (meleset di WIB).
- Grid dua kolom memakai `[&>*]:min-w-0`, Panel memakai `min-w-0` agar tabel tidak membuat halaman bisa digeser di HP.

## Status pekerjaan (per 10 Oktober 2026)

- Backend: 46/46 test lolos, lint bersih (diverifikasi ulang di Claude Code 10 Okt 2026). Frontend: lint bersih, build sukses.
- Black-box: `Dokumen_Pengujian_BlackBox_AROFTA_PADC.docx`, 77 kasus di 12 modul (AUT, PUB, PRF, BKG, SES, LAP, ULS, KAL, ADM, TPL, SUP, KEA), belum ada kolom nomor KF.
- Celah pengujian yang ditemukan: pengingat jadwal otomatis (KF-08/09/17), kedaluwarsa tagihan otomatis, alokasi/jadwal ulang sesi oleh Admin (KF-03), buka kembali laporan Final, email sungguhan (KF-16, SMTP kosong), KN-02/06/08 (butuh hosting).

## Catatan kerja

- Setelah mengubah backend: `npm run lint` dan `npm test`. Setelah mengubah frontend: `npx next lint` dan `npm run build`.
- Jika menambah endpoint, generate ulang koleksi Postman.
- Jika menambah tabel/kolom: buat migration baru, perbarui model, dan beri tahu Irza bagian laporan yang perlu direvisi.
- Jaga gaya desain: jangan menambah gradien, emoji, label kapital semua, atau kartu dekoratif seragam.
