# Backend SIM Layanan Psikologi AROFTA PADC

REST API untuk **Sistem Informasi Manajemen Layanan Psikologi Berbasis Web pada AROFTA PADC**.
Dikonsumsi oleh frontend Next.js.

**Stack:** Node.js 20+ · Express 4 · Sequelize 6 (ORM) · MySQL 8 · docxtemplater + LibreOffice (laporan PDF) · Nodemailer · node-cron · Jest + Supertest

---

## 1. Fitur

| Role | Fitur |
|---|---|
| **Klien** | Kalender jadwal tersedia, ulasan setelah sesi selesai, registrasi & login, banyak profil per akun (diri sendiri + anak), formulir Identitas Klien (dewasa) & Informasi Riwayat Anak, data keluarga/organisasi/referensi, booking layanan + pilih slot jadwal & psikolog, info rekening + link Google Form bukti transfer, konfirmasi "sudah transfer", batal booking, jadwal & tautan sesi, notifikasi, unduh laporan hasil (PDF) |
| **Psikolog** | Dashboard, profil, Kalender Jadwal (slot & sesi per bulan), kelola slot jadwal (satuan & berulang), lihat ulasan, daftar sesi + data intake klien, ubah status sesi, catatan klinis (Anamnesis, Observasi Status Mental, SOAP), isi laporan dari template, pratinjau, finalisasi PDF, lihat fee |
| **Admin (Direksi)** | Dashboard & monitoring status asesmen, Kalender Jadwal semua psikolog, moderasi ulasan, kelola layanan & harga + tarif fee per layanan, kategori fee, kelola psikolog & jadwalnya, data klien, alokasi/jadwal ulang sesi, input tautan Zoom / lokasi ruangan, verifikasi pembayaran, Fee Psikolog & pencairan, pengeluaran & laporan keuangan bulanan/tahunan, kelola template laporan (item psikogram + upload .docx), pengaturan (rekening, link Google Form, dll) |
| **Super Admin** | Semua akses Admin + kelola akun Admin/Super Admin, ubah role/status, reset password, audit log, backup database |
| **Otomatis** | Email + notifikasi dashboard, pengingat jadwal H-N, pembatalan tagihan lewat batas bayar, pembuatan fee saat sesi selesai, pembersihan file sementara |

## 2. Struktur Folder (Layered Architecture)

```
backend/
├── database/
│   ├── schema.sql                     # DDL 30 tabel (sumber migration awal)
│   └── arofta_padc_v3_workbench.sql   # siap import di MySQL Workbench (31 tabel + data master, s.d. migration login Google)
├── migrations/                        # Sequelize migration (perubahan struktur DB)
├── seeders/                           # data master, super admin, data dummy
│   └── data/                          # definisi 4 template laporan & psikogram
├── templates/                         # file .docx template laporan default (ber-placeholder)
├── scripts/                           # cek template, generator Postman, builder template
├── src/
│   ├── config/        env, database, konstanta (role/status)
│   ├── models/        31 model Sequelize + relasi (index.js) + fields.js (definisi form klinis)
│   ├── services/      business logic layer
│   ├── controllers/   presentation layer (request/response)
│   ├── routes/        definisi endpoint per role
│   ├── validators/    aturan validasi input (express-validator)
│   ├── middlewares/   auth JWT, RBAC, validasi, sanitasi, rate limit, upload, error handler
│   ├── jobs/          job terjadwal (node-cron)
│   ├── utils/         helper (response, pagination, tanggal, kode)
│   ├── app.js
│   └── server.js
├── storage/           PRIVAT — template/, laporan/, tmp/ (tidak bisa diakses lewat URL)
├── tests/             pengujian otomatis (Jest + Supertest)
└── postman/           koleksi API Postman
```

Alur request: `routes → middlewares → controllers → services → models → MySQL`.
Controller tidak pernah query database langsung; service tidak pernah menyentuh `req/res`.

## 3. Prasyarat

- **Node.js 20 atau lebih baru** — https://nodejs.org
- **MySQL Server 8** + **MySQL Workbench**
- **LibreOffice** (untuk konversi laporan ke PDF). Tanpa LibreOffice sistem tetap jalan, tetapi laporan dikirim dalam format .docx.
  - Windows: install LibreOffice (gratis, libreoffice.org), lalu isi `.env` → `SOFFICE_PATH="C:\Program Files\LibreOffice\program\soffice.exe"`
  - Linux: `sudo apt install libreoffice-writer-nogui fonts-crosextra-carlito fonts-crosextra-caladea`
    (font Carlito/Caladea = pengganti Calibri/Cambria agar tata letak laporan sama dengan Word)

## 4. Instalasi di Laptop (Development)

```bash
cd backend
npm install
cp .env.example .env        # Windows: copy .env.example .env
```

### 4.1 Siapkan database di MySQL Workbench
1. Buka Workbench → koneksi lokal → jalankan:
   ```sql
   CREATE DATABASE arofta_padc CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE DATABASE arofta_padc_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'arofta_app'@'localhost' IDENTIFIED BY 'GantiPasswordKuat#1';
   GRANT ALL PRIVILEGES ON arofta_padc.* TO 'arofta_app'@'localhost';
   GRANT ALL PRIVILEGES ON arofta_padc_test.* TO 'arofta_app'@'localhost';
   FLUSH PRIVILEGES;
   ```
2. Isi `.env`: `DB_USER=arofta_app`, `DB_PASSWORD="GantiPasswordKuat#1"`, `JWT_SECRET` (string acak ≥ 32 karakter), `SEED_SUPERADMIN_EMAIL`, `SEED_SUPERADMIN_PASSWORD`.
   > Nilai yang mengandung `#` atau spasi **wajib** diapit tanda kutip, contoh `DB_PASSWORD="abc#123"`.

### 4.2 Buat tabel & data awal

**Cara A — disarankan (otomatis dengan ORM):**
```bash
npm run db:migrate    # membuat 31 tabel (initial-schema, ulasan, aturan booking/privasi, login Google)
npm run db:seed       # data master + 4 template laporan + akun Super Admin (+ data dummy jika SEED_DUMMY_DATA=true)
```

**Cara B — import manual di Workbench:**
File → Open SQL Script → `database/arofta_padc_v3_workbench.sql` → Execute. Setelah itu tetap jalankan `npm run db:seed` untuk membuat akun Super Admin, dan salin `templates/<KODE>.docx` ke `storage/template/<KODE>_v1.docx`.

**Hubungan ORM dan Workbench:** struktur tabel dikelola lewat migration Sequelize (bisa diulang di laptop anggota tim & server). Workbench dipakai untuk melihat/mengecek data, menjalankan query manual, dan membuat ERD otomatis: *Database → Reverse Engineer → pilih `arofta_padc`*.
Perubahan struktur tabel dilakukan dengan membuat migration baru (`npx sequelize-cli migration:generate --name nama-perubahan`), **bukan** mengubah tabel langsung di Workbench.

### 4.3 Jalankan
```bash
npm run dev           # mode development (auto-restart)
# API: http://localhost:5000/api/v1/health
```

### 4.4 Akun dummy (`SEED_DUMMY_DATA=true`, password `Password123`)
| Email | Role |
|---|---|
| (dari `SEED_SUPERADMIN_EMAIL`) | Super Admin |
| admin@arofta.id | Admin |
| psikolog1@arofta.id, psikolog2@arofta.id | Psikolog |
| klien1@mail.com (punya profil anak), klien2@mail.com | Klien |

Jangan aktifkan data dummy di server production.

## 5. Pengujian

```bash
npm test              # 74 skenario otomatis (database arofta_padc_test di-reset setiap kali)
npm run lint
npm run template:check  # isi setiap template dengan data contoh → PDF di storage/tmp untuk dicek
```
Cakupan: registrasi, login, penguncian akun brute force, SQL injection, masking input, RBAC, batas payload, pagination, CRUD layanan/pengeluaran/pengaturan/psikolog, upload template (ekstensi ditolak & versi naik), serta alur lengkap booking → pembayaran → tautan → sesi → fee otomatis → laporan PDF → unduh → pencairan fee → laporan keuangan.

Koleksi Postman: impor `postman/AROFTA_PADC_API.postman_collection.json`. Login lewat *Auth → POST /auth/login*; Postman menyimpan cookie sesi otomatis. Jika ada endpoint baru: `node scripts/generate-postman.js`.

## 6. Konvensi API untuk Frontend

- Base URL: `{API_BASE_PATH}`, default `/api/v1` (dapat diubah, mis. `/arofta/api/v1` untuk subfolder).
- Autentikasi memakai **cookie httpOnly** yang dikirim otomatis. Di Next.js gunakan `fetch(url, { credentials: 'include' })` atau `axios` dengan `withCredentials: true`. Token tidak disimpan di localStorage.
- Format response:
  ```json
  { "success": true, "message": "Berhasil", "data": {}, "meta": { "page": 1, "limit": 10, "total": 42, "total_pages": 5 } }
  { "success": false, "message": "Data yang dikirim tidak valid", "errors": [{ "field": "email", "msg": "Format email tidak valid" }] }
  ```
- Kode status: 200/201 sukses · 401 belum login · 403 tidak berhak · 404 tidak ditemukan · 409 konflik status/data · 413 payload terlalu besar · 422 validasi · 423 akun terkunci · 429 terlalu banyak request.
- List memakai `?page=&limit=` (maks 50).
- Unduh laporan: `GET /laporan/:id/unduh` (PDF), staf dapat `?format=docx`.

Daftar endpoint lengkap ada di koleksi Postman (165 endpoint).

**Kalender Jadwal:**
- `GET /jadwal/kalender?bulan=&tahun=&id_psikolog=&tipe_sesi=` (publik): tanggal yang masih punya slot kosong → tandai di kalender; klik tanggal → `GET /jadwal/tersedia?tanggal=YYYY-MM-DD` untuk daftar jam & psikolog.
- `GET /admin/kalender` dan `GET /psikolog/kalender` (`?bulan=&tahun=`): seluruh slot & sesi satu bulan untuk tampilan kalender staf. Slot diisi lewat endpoint jadwal (psikolog sendiri atau Admin untuk psikolog mana pun).

**Ulasan:** `POST /klien/sesi/:id/ulasan` (setelah sesi Selesai, 1x per sesi) · publik `GET /psikolog/:id/ulasan` (nama klien disamarkan) · Admin `GET /admin/ulasan`, `PATCH /admin/ulasan/:id/tampil`.

## 7. Alur Bisnis Utama

0. **Akun**: klien daftar lewat formulir (centang Kebijakan Privasi) atau **Masuk dengan Google** (OpenID Connect, `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`). Akun psikolog/Admin/Super Admin dibuat staf (password boleh kosong, lalu masuk dengan Google memakai email yang sama).
1. **Booking**: klien memilih layanan → sistem cek formulir intake sesuai layanan → klien memilih slot (paling lambat `batas_booking_jam` sebelum jadwal, maks. `maks_booking_belum_bayar` booking belum dibayar) dan menyetujui informed consent → sesi `Terdaftar`, slot `Dipesan`, tagihan `Menunggu Pembayaran`. Batas bayar = yang lebih dulu antara `batas_bayar_jam` setelah booking atau `batas_bayar_sebelum_sesi_jam` sebelum sesi.
2. **Pembayaran manual**: klien transfer ke rekening → klik *Konfirmasi via WhatsApp* (pesan terisi kode booking, dikirim ke `kontak_whatsapp` beserta foto bukti; status `Menunggu Verifikasi`, Admin diberi tahu) → Admin cek bukti di WhatsApp & mutasi rekening → `Lunas` / `Ditolak` (dengan alasan, batas bayar baru). Tagihan yang lewat batas bayar dibatalkan otomatis dan slot dibuka kembali. Admin dapat mengubah nominal (dengan alasan; fee psikolog tetap).
   - **Booking mendesak** (`POST /admin/booking`): Admin membuat booking untuk klien terdaftar, klien walk-in tanpa akun, atau akun baru (email undangan atur password), slot ada atau jam baru, langsung `Lunas` (Tunai/Transfer).
3. **Tautan sesi**: setelah lunas, Admin menginput tautan Zoom (online) atau lokasi ruangan (offline) → terkirim ke klien & psikolog (dashboard + email). Pengingat otomatis dikirim N jam sebelum sesi.
4. **Pelaksanaan**: psikolog mengubah status `Berjalan` → mengisi Anamnesis/Observasi/SOAP → `Selesai` → sistem membuat **Fee Psikolog** otomatis dari tarif fee layanan.
5. **Laporan**: psikolog mengisi aspek psikogram & kesimpulan sesuai template → pratinjau → finalisasi → sistem mengisi file Word klinik → PDF → klien mendapat notifikasi & mengunduh.
6. **Keuangan**: Admin mencairkan fee (transfer manual) → laporan bulanan: pemasukan (pembayaran lunas) − pengeluaran (fee dicairkan + biaya operasional) = surplus.

## 8. Template Laporan

Empat template bawaan dibuat dari dokumen klinik (kop & format asli dipertahankan):

| Kode | Dokumen asal | Skala |
|---|---|---|
| `TES_ANAK` | Draft Laporan Tes Anak | 1–6 |
| `MINAT_BAKAT` | Draft Laporan Tes Minat Bakat | 1–5 |
| `REKRUTMEN` | Draft Rekrutmen | 1–5 |
| `PSIKOLOGI_UMUM` | Template Laporan Psikologi | 1–5 |

**Mengubah tampilan laporan:** Admin mengunduh file template (`GET /admin/template-laporan/:id/file`), mengedit di Word tanpa mengubah teks dalam kurung kurawal `{...}`, lalu mengunggah kembali (`POST /admin/template-laporan/:id/file`). Versi naik otomatis dan file lama tetap tersimpan.
**Menambah/mengubah aspek psikogram:** lewat endpoint item template. Daftar placeholder yang tersedia: `GET /admin/template-laporan/:id/panduan`.

Contoh placeholder: `{nama}`, `{tanggal_lahir}`, `{usia}`, `{tanggal_tes}`, `{psikolog_nama}`, `{psikolog_sipp}`, `{kesimpulan}`.
Tabel psikogram berulang: baris berisi `{#items}{no}. {label} {deskripsi} {c1} … {c5}{/items}`, di mana `{c1}`..`{cN}` berisi tanda √ pada kolom nilai.

> Catatan: template `PSIKOLOGI_UMUM` asli berisi gambar QR tanda tangan di bagian penanggung jawab. Gambar tersebut ikut tercetak pada setiap laporan dengan template ini. Ganti/hapus lewat Word lalu unggah ulang bila tidak sesuai.

## 9. Penerapan SOP Capstone

| SOP | Penerapan |
|---|---|
| Brute force | Rate limit login per IP (10/15 menit) + akun terkunci 15 menit setelah 5x gagal; batas umum API per IP lewat `API_RATE_LIMIT` (default 1500 per 15 menit) |
| SQL injection | Semua query lewat Sequelize/parameter binding, tidak ada penggabungan string SQL |
| Validasi & masking | express-validator di setiap endpoint + sanitasi global (hapus tag HTML & karakter `< >`), hanya field tervalidasi yang diteruskan (anti mass-assignment) |
| Upload | Hanya `.docx` (cek ekstensi + MIME + isi file), maks `UPLOAD_MAX_SIZE_MB`, 1 file per request |
| File sensitif | Laporan & template di `storage/` (bukan folder publik), diunduh lewat controller yang memeriksa hak akses |
| No hardcode | URL, secret, credential di `.env`; role/status di `config/constants.js`; rekening, nomor WhatsApp, dan aturan waktu booking di tabel `pengaturan` |
| Subdirectory | Seluruh route di bawah `API_BASE_PATH` |
| Payload | Body JSON/form maksimal 10 KB |
| Pagination | Semua list dibatasi `limit` maks 50, atribut kolom dipilih eksplisit |
| Password | bcrypt (cost 12), tidak pernah dikirim dalam response |
| CRUD | Create/Read/Update/Delete untuk data master; data yang sudah dipakai di transaksi dinonaktifkan (soft delete) agar riwayat aman |
| Testing | Jest + Supertest + seeder dummy + koleksi Postman, dapat dijalankan ulang |
| Lainnya | Helmet (security headers), CORS whitelist, HPP, audit log, backup database |

## 10. Deploy ke Server (Prodi / VPS Linux)

**Tanyakan ke admin server prodi:**
1. Bisa menjalankan **Node.js ≥ 20** sebagai proses yang selalu hidup (PM2/systemd)?
2. Tersedia **MySQL 8** (atau MariaDB 10.6+) dan boleh dibuatkan database + user khusus?
3. Boleh install **LibreOffice** + font Carlito/Caladea? (jika tidak: kosongkan `SOFFICE_PATH`, laporan dikirim .docx)
4. Aplikasi diakses lewat **subdomain** (`arofta.prodi.ac.id`) atau **subfolder** (`prodi.ac.id/arofta`)? Apakah sudah **HTTPS**?
5. Apakah server bisa mengirim email (SMTP kampus / Gmail App Password)?

**Langkah deploy:**
```bash
git clone <repo> && cd backend
npm ci --omit=dev
cp .env.example .env    # isi NODE_ENV=production, DB_*, JWT_SECRET, CORS_ORIGIN, FRONTEND_URL, SMTP_*, COOKIE_SECURE=true, TRUST_PROXY=1
npx sequelize-cli db:migrate --env production
npx sequelize-cli db:seed --seed 20261009000001-master-data.js --env production
npx sequelize-cli db:seed --seed 20261009000002-super-admin.js --env production
npm install -g pm2 && pm2 start src/server.js --name arofta-api && pm2 save
```
Contoh Nginx (subfolder `/arofta`): frontend `NEXT_PUBLIC_BASE_PATH=/arofta`, backend tetap `API_BASE_PATH=/api/v1`, `TRUST_PROXY=1`:
```nginx
# Nginx meneruskan semua request ke frontend Next.js (port 3000);
# Next.js meneruskan /api ke backend (port 5000). Backend tidak perlu dibuka ke publik.
location /arofta/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;   # timpa, jangan tambahkan header dari klien
    proxy_set_header X-Forwarded-Proto $scheme;
    client_max_body_size 3m;
}
```
Backup berkala (KN-09): jadwalkan `npm run backup` lewat cron server, atau unduh dari menu Super Admin.

Jika frontend dan backend berada di domain berbeda, set `COOKIE_SAMESITE=none` dan `COOKIE_SECURE=true` (wajib HTTPS).
