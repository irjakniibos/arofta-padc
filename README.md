# SIM Layanan Psikologi AROFTA PADC

Sistem Informasi Manajemen Layanan Psikologi Berbasis Web pada AROFTA PADC (Psychological Assessment and Development Center, Kartasura, Sukoharjo). Proyek Capstone Informatika UMY.

- `backend/`: REST API Node.js + Express + Sequelize + MySQL (detail teknis di [backend/README.md](backend/README.md))
- `frontend/`: Next.js 15 (App Router) + Tailwind CSS (detail di [frontend/README.md](frontend/README.md))

Panduan di bawah untuk anggota tim yang ingin menjalankan dan mencoba aplikasi di laptop sendiri. Setiap laptop memakai database sendiri, jadi data yang kamu buat tidak tercampur dengan data teman.

---

## 1. Yang perlu dipasang

| Aplikasi | Versi | Keterangan |
|---|---|---|
| [Git](https://git-scm.com/downloads) | terbaru | untuk mengambil kode |
| [Node.js](https://nodejs.org/) | 20 atau lebih baru (pilih LTS) | cek dengan `node -v` |
| [MySQL Server + MySQL Workbench](https://dev.mysql.com/downloads/installer/) | 8.x | catat **port** dan **password root** saat instalasi |
| [LibreOffice](https://www.libreoffice.org/download/) | opsional | agar laporan hasil keluar sebagai PDF; tanpa ini laporan berupa file Word (.docx) |

## 2. Ambil kode

```bash
git clone <alamat-repository>
cd arofta-padc
```

## 3. Siapkan database

Buka MySQL Workbench, masuk ke koneksi lokal (user root), lalu jalankan:

```sql
CREATE DATABASE arofta_padc CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE arofta_padc_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'arofta_app'@'localhost' IDENTIFIED BY 'PasswordKamuSendiri1';
GRANT ALL PRIVILEGES ON arofta_padc.* TO 'arofta_app'@'localhost';
GRANT ALL PRIVILEGES ON arofta_padc_test.* TO 'arofta_app'@'localhost';
FLUSH PRIVILEGES;
```

Ganti `PasswordKamuSendiri1` dengan password pilihanmu.

## 4. Jalankan backend

```bash
cd backend
npm install
copy .env.example .env
```

(Di Mac/Linux pakai `cp .env.example .env`.)

Buka `backend/.env`, lalu isi minimal bagian berikut:

| Kunci | Isi |
|---|---|
| `DB_PORT` | port MySQL kamu (biasanya `3306`) |
| `DB_PASSWORD` | password `arofta_app` dari langkah 3, **apit dengan tanda kutip**, contoh `DB_PASSWORD="PasswordKamuSendiri1"` |
| `JWT_SECRET` | teks acak panjang, buat dengan perintah di bawah |
| `SEED_SUPERADMIN_PASSWORD` | password untuk akun Super Admin, contoh `"SuperAdmin123"` |
| `SEED_DUMMY_DATA` | `true` (membuat akun dan jadwal contoh untuk mencoba) |
| `SOFFICE_PATH` | Windows: `"C:\Program Files\LibreOffice\program\soffice.exe"`; kosongkan bila tidak memasang LibreOffice |

Membuat `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Bagian **Login dengan Google** dan **Email (SMTP)** boleh dikosongkan:
- Tanpa Google: tombol "Masuk dengan Google" tidak muncul, login memakai email dan password.
- Tanpa SMTP: email (misalnya tautan lupa password) tidak dikirim, tetapi isinya dan tautannya dicetak di terminal backend.

Lalu buat tabel, data awal, dan jalankan:

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

Backend berjalan bila terminal menampilkan "Terhubung ke database" dan server di port 5000. Biarkan terminal ini tetap terbuka.

## 5. Jalankan frontend

Buka terminal **kedua**:

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Isi bawaan `.env.local` sudah cocok untuk laptop, tidak perlu diubah. Setelah muncul "Ready", buka **http://localhost:3000**.

## 6. Akun untuk mencoba

Semua akun contoh memakai password `Password123`:

| Role | Email |
|---|---|
| Admin | `admin@arofta.id` |
| Psikolog | `psikolog1@arofta.id`, `psikolog2@arofta.id` |
| Klien | `klien1@mail.com`, `klien2@mail.com` |
| Super Admin | `superadmin@arofta.id` (password dari `SEED_SUPERADMIN_PASSWORD`) |

Semua role masuk lewat halaman yang sama: http://localhost:3000/masuk. Kamu juga bisa mendaftar akun klien baru di http://localhost:3000/daftar.

Skenario uji yang disarankan: klien melengkapi profil dan formulir, lalu booking. Admin memverifikasi pembayaran dan mengisi tautan sesi. Psikolog memulai sesi, mengisi catatan klinis, menyelesaikan sesi, lalu menyusun dan memfinalisasi laporan. Terakhir klien mengunduh laporan dan memberi ulasan.

## 7. Mencoba login Google dan email sungguhan (opsional)

1. Minta `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` ke Irza lewat **pesan pribadi**, jangan di grup atau di repository. Isi di `backend/.env`.
2. Minta Irza menambahkan Gmail kamu ke daftar **Test users** di Google Cloud. Selama aplikasi Google masih status Testing, hanya email di daftar itu yang bisa login.
3. Untuk email sungguhan, buat App Password dari Gmail kamu sendiri (Akun Google, Keamanan, Verifikasi 2 Langkah, Sandi aplikasi), lalu isi `SMTP_*` dan `MAIL_FROM` sesuai contoh di `.env.example`.
4. Hentikan backend (Ctrl+C), lalu jalankan lagi `npm run dev`.

## 8. Masalah yang sering muncul

| Pesan / gejala | Penyebab dan solusi |
|---|---|
| `Konfigurasi .env wajib diisi: ...` | Kunci tersebut masih kosong di `backend/.env` |
| `Access denied for user 'arofta_app'` | Password di `.env` tidak sama dengan langkah 3, atau lupa tanda kutip |
| `ECONNREFUSED 127.0.0.1:3306` | MySQL belum jalan, atau `DB_PORT` tidak sesuai port MySQL kamu |
| `EADDRINUSE :::5000` / `:3000` | Port dipakai program lain atau backend/frontend sudah berjalan di terminal lain; tutup yang lama |
| Halaman terbuka tetapi data tidak muncul | Backend belum berjalan; cek terminal pertama |
| Laporan keluar sebagai .docx, bukan PDF | LibreOffice belum terpasang atau `SOFFICE_PATH` salah |

**Jangan** menjalankan `npm run db:reset` kecuali memang ingin menghapus semua data dan mengulang dari awal. Untuk perubahan struktur database dari kode terbaru cukup `npm run db:migrate`.

## 9. Mengambil pembaruan kode

```bash
git pull
cd backend && npm install && npm run db:migrate
cd ../frontend && npm install
```

Lalu jalankan ulang backend dan frontend.
