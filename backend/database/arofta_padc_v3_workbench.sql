-- =====================================================================
-- DATABASE SIM LAYANAN PSIKOLOGI AROFTA PADC — v3 (untuk MySQL Workbench)
-- Berisi: struktur 31 tabel + data master (layanan, kategori fee, 4 template laporan, pengaturan).
-- TIDAK berisi akun apa pun. Setelah import, buat akun Super Admin dengan:
--     npm run db:seed        (membaca SEED_SUPERADMIN_EMAIL & SEED_SUPERADMIN_PASSWORD dari .env)
-- lalu salin file template:  templates/<KODE>.docx  ->  storage/template/<KODE>_v1.docx
--
-- Cara import di Workbench: File > Open SQL Script > pilih file ini > Execute (ikon petir).
-- PERINGATAN: script ini menghapus database arofta_padc jika sudah ada.
-- Cara yang disarankan: npm run db:migrate && npm run db:seed (otomatis, tanpa import manual).
-- =====================================================================

DROP DATABASE IF EXISTS arofta_padc;
CREATE DATABASE arofta_padc CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE arofta_padc;

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================================
-- SKEMA DATABASE SIM LAYANAN PSIKOLOGI AROFTA PADC — v3
-- Dipakai oleh migration awal Sequelize (migrations/20261009000001-initial-schema.js)
-- Untuk dijalankan manual di MySQL Workbench gunakan arofta_padc_v3_workbench.sql
-- Konvensi: tabel & kolom huruf kecil snake_case, engine InnoDB, utf8mb4
-- =====================================================================

-- ---------------------------------------------------------------------
-- A. AKUN & AKTOR
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id_user               INT AUTO_INCREMENT PRIMARY KEY,
    email                 VARCHAR(255) NOT NULL UNIQUE,
    password              VARCHAR(255) NOT NULL COMMENT 'hash bcrypt',
    role                  ENUM('Klien','Psikolog','Admin','Super Admin') NOT NULL COMMENT 'Admin = Direksi',
    is_active             BOOLEAN NOT NULL DEFAULT TRUE,
    failed_login_attempts INT NOT NULL DEFAULT 0,
    locked_until          DATETIME NULL,
    last_login            DATETIME NULL,
    created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_role (role)
) ENGINE=InnoDB;

CREATE TABLE password_reset (
    id_reset    INT AUTO_INCREMENT PRIMARY KEY,
    id_user     INT NOT NULL,
    token_hash  VARCHAR(255) NOT NULL COMMENT 'sha256 token, token asli hanya dikirim via email',
    expires_at  DATETIME NOT NULL,
    used_at     DATETIME NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE,
    INDEX idx_reset_token (token_hash)
) ENGINE=InnoDB;

-- Satu akun dapat memiliki beberapa profil klien (diri sendiri + anak yang diperiksa)
CREATE TABLE klien (
    id_klien               INT AUTO_INCREMENT PRIMARY KEY,
    id_user                INT NOT NULL,
    hubungan_akun          ENUM('Diri Sendiri','Anak','Lainnya') NOT NULL DEFAULT 'Diri Sendiri',
    nomor_rekam_psikologi  VARCHAR(30) NULL UNIQUE COMMENT 'dibuat otomatis: RP-YYYY-00001',
    nama_lengkap           VARCHAR(150) NOT NULL,
    jenis_kelamin          ENUM('Laki-laki','Perempuan') NULL,
    tempat_lahir           VARCHAR(100) NULL,
    tanggal_lahir          DATE NULL,
    alamat_rumah           TEXT NULL,
    no_hp                  VARCHAR(20) NULL,
    agama                  VARCHAR(50) NULL,
    kewarganegaraan        VARCHAR(50) NULL,
    suku_bangsa            VARCHAR(50) NULL,
    pendidikan_terakhir    VARCHAR(100) NULL,
    pekerjaan              VARCHAR(100) NULL,
    status_pernikahan      ENUM('Belum Menikah','Menikah','Bercerai','Janda','Duda') NULL,
    tahun_menikah          SMALLINT NULL,
    created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_klien_nama (nama_lengkap)
) ENGINE=InnoDB;

CREATE TABLE psikolog (
    id_psikolog      INT AUTO_INCREMENT PRIMARY KEY,
    id_user          INT NOT NULL UNIQUE,
    nama_lengkap     VARCHAR(150) NOT NULL COMMENT 'lengkap dengan gelar, tampil di laporan',
    sipp             VARCHAR(50) NULL UNIQUE,
    str              VARCHAR(50) NULL COMMENT 'STR Psikolog Klinis (opsional)',
    spesialisasi     VARCHAR(150) NULL,
    pengalaman_tahun TINYINT UNSIGNED NULL,
    profil_singkat   TEXT NULL,
    no_hp            VARCHAR(20) NULL,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- B. TEMPLATE LAPORAN (dibuat sebelum layanan karena layanan merujuk template)
-- ---------------------------------------------------------------------
CREATE TABLE template_laporan (
    id_template    INT AUTO_INCREMENT PRIMARY KEY,
    kode           VARCHAR(50) NOT NULL UNIQUE COMMENT 'mis. TES_ANAK',
    nama_template  VARCHAR(150) NOT NULL,
    deskripsi      TEXT NULL,
    file_docx      VARCHAR(255) NULL COMMENT 'nama file .docx ber-placeholder di storage/template',
    skala_min      TINYINT NOT NULL DEFAULT 1,
    skala_max      TINYINT NOT NULL DEFAULT 5,
    keterangan_skala VARCHAR(255) NULL COMMENT 'mis. 1=Rendah;2=Kurang;3=Cukup;4=Baik;5=Tinggi',
    versi          INT NOT NULL DEFAULT 1,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (skala_max > skala_min)
) ENGINE=InnoDB;

-- Item = aspek psikogram (skala), isian teks (uraian/saran), atau pilihan (kesimpulan)
CREATE TABLE template_item (
    id_item      INT AUTO_INCREMENT PRIMARY KEY,
    id_template  INT NOT NULL,
    kode         VARCHAR(60) NOT NULL COMMENT 'kunci placeholder di file docx',
    kelompok     VARCHAR(100) NOT NULL COMMENT 'mis. INTELEKTUAL, KEPRIBADIAN, KESIMPULAN',
    urutan       SMALLINT NOT NULL,
    label        VARCHAR(150) NOT NULL,
    deskripsi    TEXT NULL,
    tipe         ENUM('skala','teks','pilihan') NOT NULL,
    opsi         VARCHAR(500) NULL COMMENT 'untuk tipe pilihan, dipisah ;',
    wajib        BOOLEAN NOT NULL DEFAULT TRUE,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE KEY uq_item_kode (id_template, kode),
    INDEX idx_item_urutan (id_template, urutan),
    FOREIGN KEY (id_template) REFERENCES template_laporan(id_template) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- C. MASTER LAYANAN, FEE, PENGATURAN
-- ---------------------------------------------------------------------
CREATE TABLE layanan (
    id_layanan    INT AUTO_INCREMENT PRIMARY KEY,
    nama_layanan  VARCHAR(150) NOT NULL,
    kategori      ENUM('Anak dan Remaja','Industri','Masyarakat Umum') NOT NULL,
    deskripsi     TEXT NULL,
    harga         DECIMAL(12,2) NOT NULL,
    durasi_menit  SMALLINT NOT NULL DEFAULT 60,
    jenis_intake  ENUM('Dewasa','Anak','Tidak Ada') NOT NULL DEFAULT 'Dewasa',
    id_template   INT NULL COMMENT 'template laporan hasil untuk layanan ini',
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_template) REFERENCES template_laporan(id_template) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_layanan_kategori (kategori, is_active),
    CHECK (harga >= 0)
) ENGINE=InnoDB;

CREATE TABLE kategori_fee (
    id_kategori_fee  INT AUTO_INCREMENT PRIMARY KEY,
    nama_kategori    VARCHAR(150) NOT NULL UNIQUE,
    nominal_default  DECIMAL(12,2) NOT NULL,
    keterangan       TEXT NULL,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE layanan_fee (
    id_layanan_fee   INT AUTO_INCREMENT PRIMARY KEY,
    id_layanan       INT NOT NULL,
    id_kategori_fee  INT NOT NULL,
    nominal          DECIMAL(12,2) NOT NULL,
    UNIQUE KEY uq_layanan_kategori (id_layanan, id_kategori_fee),
    FOREIGN KEY (id_layanan) REFERENCES layanan(id_layanan) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_kategori_fee) REFERENCES kategori_fee(id_kategori_fee) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE pengaturan (
    kunci       VARCHAR(100) PRIMARY KEY,
    nilai       TEXT NOT NULL,
    keterangan  VARCHAR(255) NULL,
    is_public   BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'TRUE = boleh ditampilkan ke klien',
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- D. INTAKE KLIEN DEWASA (Form Identitas Klien)
-- ---------------------------------------------------------------------
CREATE TABLE intake_dewasa (
    id_intake_dewasa        INT AUTO_INCREMENT PRIMARY KEY,
    id_klien                INT NOT NULL UNIQUE,
    kegemaran_hobi          TEXT NULL,
    kursus_pelatihan_keahlian TEXT NULL,
    kelebihan               TEXT NULL COMMENT 'satu poin per baris',
    kekurangan              TEXT NULL COMMENT 'satu poin per baris',
    keluhan_saat_ini        TEXT NULL,
    harapan_pemeriksaan     TEXT NULL,
    pernah_sakit_berat      BOOLEAN NOT NULL DEFAULT FALSE,
    sakit_tahun             VARCHAR(10) NULL,
    sakit_lama              VARCHAR(50) NULL,
    sakit_diagnosa          VARCHAR(255) NULL,
    sakit_dirawat_di        VARCHAR(150) NULL,
    pernah_psikotes         BOOLEAN NOT NULL DEFAULT FALSE,
    psikotes_tahun          VARCHAR(10) NULL,
    psikotes_tempat         VARCHAR(150) NULL,
    psikotes_keperluan      VARCHAR(255) NULL,
    pernyataan_benar        BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'centang pernyataan data diisi dengan jujur',
    created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_klien) REFERENCES klien(id_klien) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Susunan keluarga (dipakai form dewasa, form anak, dan formulir SOAP)
CREATE TABLE keluarga_klien (
    id_keluarga           INT AUTO_INCREMENT PRIMARY KEY,
    id_klien              INT NOT NULL,
    kategori              ENUM('Pasangan','Anak','Ayah','Ibu','Saudara','Serumah') NOT NULL,
    status_hubungan       ENUM('Kandung','Tiri','Angkat') NULL,
    nama                  VARCHAR(150) NOT NULL,
    jenis_kelamin         ENUM('Laki-laki','Perempuan') NULL,
    usia                  VARCHAR(20) NULL,
    tempat_tanggal_lahir  VARCHAR(150) NULL,
    agama                 VARCHAR(50) NULL,
    pendidikan            VARCHAR(100) NULL,
    pekerjaan             VARCHAR(100) NULL,
    alamat                TEXT NULL,
    keterangan            VARCHAR(255) NULL,
    masih_hidup           BOOLEAN NOT NULL DEFAULT TRUE,
    urutan                TINYINT NOT NULL DEFAULT 1,
    FOREIGN KEY (id_klien) REFERENCES klien(id_klien) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_keluarga_klien (id_klien, kategori)
) ENGINE=InnoDB;

CREATE TABLE riwayat_organisasi (
    id_organisasi     INT AUTO_INCREMENT PRIMARY KEY,
    id_klien          INT NOT NULL,
    nama_organisasi   VARCHAR(150) NOT NULL,
    jenis_organisasi  VARCHAR(100) NULL,
    tahun             VARCHAR(20) NULL,
    jabatan           VARCHAR(100) NULL,
    FOREIGN KEY (id_klien) REFERENCES klien(id_klien) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE referensi_klien (
    id_referensi    INT AUTO_INCREMENT PRIMARY KEY,
    id_klien        INT NOT NULL,
    nama            VARCHAR(150) NOT NULL,
    alamat_telepon  VARCHAR(255) NULL,
    jabatan         VARCHAR(100) NULL,
    hubungan        VARCHAR(100) NULL,
    FOREIGN KEY (id_klien) REFERENCES klien(id_klien) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- E. INTAKE ANAK (Form Informasi Riwayat Anak)
-- ---------------------------------------------------------------------
CREATE TABLE intake_anak (
    id_intake_anak             INT AUTO_INCREMENT PRIMARY KEY,
    id_klien                   INT NOT NULL UNIQUE,
    nama_sekolah               VARCHAR(150) NULL,
    kelas                      VARCHAR(50) NULL,
    penyakit_pernah_diderita   TEXT NULL,
    lama_menderita_penyakit    VARCHAR(100) NULL,
    berat_badan_kg             DECIMAL(5,1) NULL,
    tinggi_badan_cm            DECIMAL(5,1) NULL,
    gangguan_perkembangan_lain TEXT NULL,
    created_at                 DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                 DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_klien) REFERENCES klien(id_klien) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE riwayat_kelahiran_asi (
    id_kelahiran            INT AUTO_INCREMENT PRIMARY KEY,
    id_intake_anak          INT NOT NULL UNIQUE,
    keguguran_sebelumnya    ENUM('Ya','Tidak') NULL,
    perasaan_waktu_hamil    TEXT NULL,
    anak_diinginkan         ENUM('Ya','Tidak','Tidak Tahu') NULL,
    umur_kandungan          VARCHAR(50) NULL,
    proses_kelahiran        VARCHAR(100) NULL COMMENT 'normal/caesar/mudah/sulit/butuh bantuan',
    skor_apgar              VARCHAR(20) NULL,
    tempat_melahirkan       VARCHAR(150) NULL,
    ditolong_oleh           VARCHAR(100) NULL,
    berat_lahir_kg          DECIMAL(4,2) NULL,
    panjang_lahir_cm        DECIMAL(4,1) NULL,
    asi_hingga_usia         VARCHAR(50) NULL,
    susu_formula_mulai      VARCHAR(50) NULL,
    susu_formula_hingga     VARCHAR(50) NULL,
    makanan_tambahan_usia   VARCHAR(50) NULL,
    kualitas_makanan        ENUM('Baik','Cukup','Kurang') NULL,
    kesukaran_makan         TEXT NULL,
    FOREIGN KEY (id_intake_anak) REFERENCES intake_anak(id_intake_anak) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE riwayat_perkembangan_anak (
    id_perkembangan        INT AUTO_INCREMENT PRIMARY KEY,
    id_intake_anak         INT NOT NULL UNIQUE,
    bak_usia               VARCHAR(50) NULL,
    bak_cara_dilatih       TEXT NULL,
    bab_usia               VARCHAR(50) NULL,
    bab_cara_dilatih       TEXT NULL,
    gosok_gigi_usia        VARCHAR(50) NULL,
    mandi_sendiri_usia     VARCHAR(50) NULL,
    telungkup_bulan        VARCHAR(20) NULL,
    merangkak_bulan        VARCHAR(20) NULL,
    duduk_bulan            VARCHAR(20) NULL,
    berdiri_bulan          VARCHAR(20) NULL,
    berjalan_bulan         VARCHAR(20) NULL,
    kesulitan_gerak        TEXT NULL,
    kata_pertama_bulan     VARCHAR(20) NULL,
    kalimat_lengkap_bulan  VARCHAR(20) NULL,
    kesulitan_bahasa       TEXT NULL,
    FOREIGN KEY (id_intake_anak) REFERENCES intake_anak(id_intake_anak) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE riwayat_pendidikan_sosial_anak (
    id_pendidikan_sosial        INT AUTO_INCREMENT PRIMARY KEY,
    id_intake_anak              INT NOT NULL UNIQUE,
    hubungan_dengan_saudara     TEXT NULL,
    hubungan_dengan_teman       TEXT NULL,
    hobi                        TEXT NULL,
    minat                       TEXT NULL,
    aktivitas_rekreasi          TEXT NULL,
    penerimaan_tanggung_jawab   TEXT NULL,
    sikap_masalah_belajar       TEXT NULL,
    sifat_sosial_menonjol       TEXT NULL,
    sikap_kepribadian_menonjol  TEXT NULL,
    masuk_tk_umur               VARCHAR(20) NULL,
    masuk_sd_umur               VARCHAR(20) NULL,
    pernah_tinggal_kelas        ENUM('Ya','Tidak') NULL,
    tinggal_di_kelas            VARCHAR(20) NULL,
    kesulitan_membaca           TEXT NULL,
    kesulitan_menulis           TEXT NULL,
    kesulitan_berhitung         TEXT NULL,
    aspek_lain                  TEXT NULL,
    bantuan_di_sd               TEXT NULL,
    sikap_terhadap_guru         TEXT NULL,
    sikap_terhadap_teman_sekolah TEXT NULL,
    sikap_terhadap_sekolah      TEXT NULL,
    FOREIGN KEY (id_intake_anak) REFERENCES intake_anak(id_intake_anak) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- F. JADWAL & SESI
-- ---------------------------------------------------------------------
CREATE TABLE jadwal_psikolog (
    id_jadwal    INT AUTO_INCREMENT PRIMARY KEY,
    id_psikolog  INT NOT NULL,
    tanggal      DATE NOT NULL,
    jam_mulai    TIME NOT NULL,
    jam_selesai  TIME NOT NULL,
    tipe_sesi    ENUM('Online','Offline','Keduanya') NOT NULL DEFAULT 'Keduanya',
    status_slot  ENUM('Tersedia','Dipesan','Ditutup') NOT NULL DEFAULT 'Tersedia',
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_slot (id_psikolog, tanggal, jam_mulai),
    INDEX idx_jadwal_cari (tanggal, status_slot),
    FOREIGN KEY (id_psikolog) REFERENCES psikolog(id_psikolog) ON DELETE CASCADE ON UPDATE CASCADE,
    CHECK (jam_selesai > jam_mulai)
) ENGINE=InnoDB;

CREATE TABLE sesi_asesmen (
    id_sesi            INT AUTO_INCREMENT PRIMARY KEY,
    kode_booking       VARCHAR(30) NOT NULL UNIQUE,
    id_klien           INT NOT NULL,
    id_psikolog        INT NOT NULL,
    id_layanan         INT NOT NULL,
    id_jadwal          INT NULL UNIQUE,
    tanggal            DATE NOT NULL,
    waktu              TIME NOT NULL,
    tipe_sesi          ENUM('Online','Offline') NOT NULL,
    status_asesmen     ENUM('Terdaftar','Berjalan','Selesai','Batal') NOT NULL DEFAULT 'Terdaftar',
    tautan_zoom        VARCHAR(512) NULL,
    lokasi_ruangan     VARCHAR(255) NULL,
    catatan_klien      TEXT NULL,
    alasan_batal       TEXT NULL,
    reminder_terkirim  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_klien)    REFERENCES klien(id_klien)            ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (id_psikolog) REFERENCES psikolog(id_psikolog)      ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (id_layanan)  REFERENCES layanan(id_layanan)        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (id_jadwal)   REFERENCES jadwal_psikolog(id_jadwal) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_sesi_status (status_asesmen, tanggal),
    INDEX idx_sesi_psikolog (id_psikolog, tanggal),
    INDEX idx_sesi_klien (id_klien, tanggal)
) ENGINE=InnoDB;

CREATE TABLE pembayaran (
    id_pembayaran       INT AUTO_INCREMENT PRIMARY KEY,
    id_sesi             INT NOT NULL UNIQUE,
    total_bayar         DECIMAL(12,2) NOT NULL,
    metode_bayar        VARCHAR(50) NOT NULL DEFAULT 'Transfer Bank',
    status_pembayaran   ENUM('Menunggu Pembayaran','Menunggu Verifikasi','Lunas','Ditolak','Batal') NOT NULL DEFAULT 'Menunggu Pembayaran',
    batas_bayar         DATETIME NULL,
    tanggal_konfirmasi  DATETIME NULL,
    diverifikasi_oleh   INT NULL,
    tanggal_verifikasi  DATETIME NULL,
    catatan_admin       TEXT NULL,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_sesi) REFERENCES sesi_asesmen(id_sesi) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (diverifikasi_oleh) REFERENCES users(id_user) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_bayar_status (status_pembayaran, created_at)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- G. CATATAN KLINIS PER SESI (Formulir Asesmen & Catatan Konseling / SOAP)
--    Internal: hanya psikolog penangani & Admin
-- ---------------------------------------------------------------------
CREATE TABLE anamnesis_sesi (
    id_anamnesis                 INT AUTO_INCREMENT PRIMARY KEY,
    id_sesi                      INT NOT NULL UNIQUE,
    rujukan                      VARCHAR(100) NULL COMMENT 'Datang sendiri/Orang tua/Sekolah/Dokter/Psikolog/lainnya',
    keluhan_utama                TEXT NULL,
    awal_munculnya_masalah       TEXT NULL,
    faktor_pencetus              TEXT NULL,
    frekuensi_durasi             TEXT NULL,
    dampak_aktivitas             TEXT NULL,
    upaya_dilakukan              TEXT NULL,
    penyakit_fisik               TEXT NULL,
    rawat_inap_operasi           TEXT NULL,
    obat_saat_ini                TEXT NULL,
    gangguan_neurologis          TEXT NULL,
    riwayat_konseling_terapi     TEXT NULL,
    riwayat_diagnosis_psikologis TEXT NULL,
    riwayat_obat_psikiatri       TEXT NULL,
    perkembangan_kehamilan_kelahiran TEXT NULL,
    perkembangan_kanak_kanak     TEXT NULL,
    perkembangan_remaja          TEXT NULL,
    perkembangan_dewasa          TEXT NULL,
    riwayat_pendidikan           TEXT NULL,
    riwayat_pekerjaan            TEXT NULL,
    hubungan_dalam_keluarga      TEXT NULL,
    riwayat_gangguan_keluarga    TEXT NULL,
    hubungan_dengan_teman        TEXT NULL,
    hubungan_dengan_pasangan     TEXT NULL,
    aktivitas_sosial             TEXT NULL,
    riwayat_spiritual            TEXT NULL,
    minat_hobi_kekuatan          TEXT NULL,
    harapan_konseling            TEXT NULL,
    updated_at                   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_sesi) REFERENCES sesi_asesmen(id_sesi) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE observasi_mental (
    id_observasi            INT AUTO_INCREMENT PRIMARY KEY,
    id_sesi                 INT NOT NULL UNIQUE,
    penampilan_umum         TEXT NULL,
    sikap_terhadap_pemeriksa TEXT NULL,
    kontak_mata             TEXT NULL,
    aktivitas_psikomotor    TEXT NULL,
    pembicaraan             TEXT NULL,
    mood                    TEXT NULL,
    afek                    TEXT NULL,
    proses_pikir            TEXT NULL,
    isi_pikir               TEXT NULL,
    persepsi                TEXT NULL,
    konsentrasi             TEXT NULL,
    memori                  TEXT NULL,
    orientasi               TEXT NULL,
    insight                 TEXT NULL,
    judgment                TEXT NULL,
    updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_sesi) REFERENCES sesi_asesmen(id_sesi) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE catatan_soap (
    id_soap                 INT AUTO_INCREMENT PRIMARY KEY,
    id_sesi                 INT NOT NULL UNIQUE,
    subjective              TEXT NULL COMMENT 'keluhan klien',
    objective               TEXT NULL COMMENT 'hasil observasi psikologis',
    diagnosis_hipotesis     TEXT NULL,
    masalah_utama           TEXT NULL,
    faktor_predisposisi     TEXT NULL,
    faktor_presipitasi      TEXT NULL,
    faktor_protektif        TEXT NULL,
    tujuan_konseling        TEXT NULL,
    intervensi              VARCHAR(500) NULL COMMENT 'pilihan checklist dipisah ;',
    intervensi_lainnya      VARCHAR(255) NULL,
    rencana_tindak_lanjut   TEXT NULL,
    jadwal_sesi_berikutnya  VARCHAR(150) NULL,
    evaluasi_perkembangan   TEXT NULL,
    updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_sesi) REFERENCES sesi_asesmen(id_sesi) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- H. LAPORAN HASIL PEMERIKSAAN (dikirim ke klien)
-- ---------------------------------------------------------------------
CREATE TABLE laporan_asesmen (
    id_laporan      INT AUTO_INCREMENT PRIMARY KEY,
    id_sesi         INT NOT NULL UNIQUE,
    id_template     INT NULL,
    status_laporan  ENUM('Draft','Final') NOT NULL DEFAULT 'Draft',
    file_docx       VARCHAR(255) NULL COMMENT 'hasil isi template, storage/laporan',
    file_pdf        VARCHAR(255) NULL COMMENT 'hasil konversi PDF, storage/laporan',
    tanggal_final   DATETIME NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_sesi) REFERENCES sesi_asesmen(id_sesi) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_template) REFERENCES template_laporan(id_template) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE jawaban_laporan (
    id_jawaban    INT AUTO_INCREMENT PRIMARY KEY,
    id_laporan    INT NOT NULL,
    id_item       INT NOT NULL,
    nilai_skala   TINYINT NULL,
    jawaban_teks  TEXT NULL,
    UNIQUE KEY uq_jawaban (id_laporan, id_item),
    FOREIGN KEY (id_laporan) REFERENCES laporan_asesmen(id_laporan) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_item) REFERENCES template_item(id_item) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- I. KEUANGAN
-- ---------------------------------------------------------------------
CREATE TABLE rekap_fee (
    id_fee             INT AUTO_INCREMENT PRIMARY KEY,
    id_sesi            INT NOT NULL,
    id_psikolog        INT NOT NULL,
    id_kategori_fee    INT NOT NULL,
    nominal_fee        DECIMAL(12,2) NOT NULL,
    status_distribusi  ENUM('Belum Dibayar','Sudah Dibayar') NOT NULL DEFAULT 'Belum Dibayar',
    tanggal_pencairan  DATETIME NULL,
    catatan            TEXT NULL,
    created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_fee_sesi_kategori (id_sesi, id_kategori_fee),
    INDEX idx_fee_psikolog (id_psikolog, status_distribusi, created_at),
    FOREIGN KEY (id_sesi) REFERENCES sesi_asesmen(id_sesi) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_psikolog) REFERENCES psikolog(id_psikolog) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (id_kategori_fee) REFERENCES kategori_fee(id_kategori_fee) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE pengeluaran (
    id_pengeluaran  INT AUTO_INCREMENT PRIMARY KEY,
    tanggal         DATE NOT NULL,
    kategori        VARCHAR(100) NOT NULL,
    keterangan      TEXT NULL,
    nominal         DECIMAL(12,2) NOT NULL,
    dicatat_oleh    INT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dicatat_oleh) REFERENCES users(id_user) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_pengeluaran_tanggal (tanggal),
    CHECK (nominal > 0)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- J. NOTIFIKASI & AUDIT
-- ---------------------------------------------------------------------
CREATE TABLE notifikasi (
    id_notifikasi   INT AUTO_INCREMENT PRIMARY KEY,
    id_user         INT NOT NULL,
    id_sesi         INT NULL,
    tipe            ENUM('Jadwal','Pembayaran','Tautan Sesi','Laporan','Fee','Sistem') NOT NULL,
    judul           VARCHAR(150) NOT NULL,
    pesan           TEXT NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    email_terkirim  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_sesi) REFERENCES sesi_asesmen(id_sesi) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_notif_user (id_user, is_read, created_at)
) ENGINE=InnoDB;

CREATE TABLE audit_log (
    id_log      BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_user     INT NULL,
    aksi        VARCHAR(50) NOT NULL,
    entitas     VARCHAR(50) NULL,
    id_entitas  VARCHAR(50) NULL,
    deskripsi   TEXT NULL,
    ip_address  VARCHAR(45) NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_audit_waktu (created_at),
    INDEX idx_audit_user (id_user, created_at)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- K. ULASAN (migration 20261009000002-ulasan)
-- ---------------------------------------------------------------------
CREATE TABLE ulasan (
    id_ulasan    INT AUTO_INCREMENT PRIMARY KEY,
    id_sesi      INT NOT NULL UNIQUE,
    id_klien     INT NOT NULL,
    id_psikolog  INT NOT NULL,
    rating       TINYINT NOT NULL,
    komentar     TEXT NULL,
    is_tampil    BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'FALSE = disembunyikan Admin',
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_sesi) REFERENCES sesi_asesmen(id_sesi) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_klien) REFERENCES klien(id_klien) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_psikolog) REFERENCES psikolog(id_psikolog) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_ulasan_psikolog (id_psikolog, is_tampil, created_at),
    CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- Tabel pencatat migration & seeder Sequelize (agar `npm run db:migrate` / `db:seed` tidak mengulang langkah yang sudah ada)
CREATE TABLE sequelize_meta (name VARCHAR(255) NOT NULL PRIMARY KEY) ENGINE=InnoDB;
CREATE TABLE sequelize_data (name VARCHAR(255) NOT NULL PRIMARY KEY) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- DATA MASTER
-- ---------------------------------------------------------------------
INSERT INTO `pengaturan` (`kunci`, `nilai`, `keterangan`, `is_public`, `updated_at`) VALUES ('alamat_klinik','-','Alamat untuk sesi offline',1,'2026-10-09 22:20:14'),
('bank_atas_nama','-','Nama pemilik rekening',1,'2026-10-09 22:20:14'),
('bank_nama','-','Nama bank tujuan transfer',1,'2026-10-09 22:20:14'),
('bank_no_rekening','-','Nomor rekening tujuan transfer',1,'2026-10-09 22:20:14'),
('batas_bayar_jam','24','Batas waktu pembayaran setelah booking (jam)',0,'2026-10-09 22:20:14'),
('kontak_whatsapp','-','Nomor WhatsApp customer service',1,'2026-10-09 22:20:14'),
('link_form_bukti_bayar','-','Link Google Form untuk mengunggah bukti transfer',1,'2026-10-09 22:20:14'),
('nama_lembaga','AROFTA PADC (Psychological Assessment and Development Center)','Nama lembaga di laporan & email',1,'2026-10-09 22:20:14'),
('reminder_jam_sebelum','24','Pengingat jadwal dikirim N jam sebelum sesi',0,'2026-10-09 22:20:14');
INSERT INTO `kategori_fee` (`id_kategori_fee`, `nama_kategori`, `nominal_default`, `keterangan`, `is_active`) VALUES (1,'Tester psikotes sederhana',25000.00,NULL,1),
(2,'Tester psikotes sedang',50000.00,NULL,1),
(3,'Tester psikotes kompleks',75000.00,NULL,1),
(4,'Skoring psikotes sederhana',25000.00,NULL,1),
(5,'Skoring psikotes sedang',50000.00,NULL,1),
(6,'Skoring psikotes kompleks',75000.00,NULL,1),
(7,'Penyusunan HPP sederhana',50000.00,NULL,1),
(8,'Penyusunan HPP sedang',100000.00,NULL,1),
(9,'Penyusunan HPP kompleks/klinis',150000.00,NULL,1),
(10,'Konseling sederhana',100000.00,NULL,1),
(11,'Konseling sedang',150000.00,NULL,1),
(12,'Konseling kompleks',200000.00,NULL,1),
(13,'Psikoterapi/Intervensi sederhana',90000.00,NULL,1),
(14,'Psikoterapi/Intervensi sedang',125000.00,NULL,1),
(15,'Psikoterapi/Intervensi kompleks',200000.00,NULL,1);
INSERT INTO `template_laporan` (`id_template`, `kode`, `nama_template`, `deskripsi`, `file_docx`, `skala_min`, `skala_max`, `keterangan_skala`, `versi`, `is_active`, `created_at`, `updated_at`) VALUES (1,'TES_ANAK','Hasil Pemeriksaan Psikologis Anak','Laporan tes psikologi anak: psikogram aspek kecerdasan, potensi belajar, dan kepribadian dengan skala 1–6.','TES_ANAK_v1.docx',1,6,'1-2=Rendah;3-4=Cukup;5-6=Tinggi',1,1,'2026-10-09 22:20:14','2026-10-09 22:20:14'),
(2,'MINAT_BAKAT','Hasil Pemeriksaan Psikologis Minat Bakat','Laporan tes minat bakat dan penjurusan: psikogram intelektual skala 1–5 beserta rekomendasi jurusan.','MINAT_BAKAT_v1.docx',1,5,'1=Rendah;2=Kurang;3=Cukup;4=Baik;5=Tinggi',1,1,'2026-10-09 22:20:14','2026-10-09 22:20:14'),
(3,'REKRUTMEN','Profil Hasil Pemeriksaan Psikologis (Rekrutmen)','Laporan asesmen rekrutmen/industri: aspek psikologis dan kompetensi manajerial skala 1–5, uraian, kelebihan, kekurangan, dan rekomendasi.','REKRUTMEN_v1.docx',1,5,'1=Rendah;2=Kurang;3=Cukup;4=Baik;5=Tinggi',1,1,'2026-10-09 22:20:14','2026-10-09 22:20:14'),
(4,'PSIKOLOGI_UMUM','Hasil Pemeriksaan Psikologis (Umum)','Laporan psikotes umum/karyawan: intelektual, sikap kerja, kepribadian, dan kebutuhan (27 aspek) skala 1–5.','PSIKOLOGI_UMUM_v1.docx',1,5,'1=Rendah;2=Kurang;3=Cukup;4=Baik;5=Tinggi',1,1,'2026-10-09 22:20:14','2026-10-09 22:20:14');
INSERT INTO `template_item` (`id_item`, `id_template`, `kode`, `kelompok`, `urutan`, `label`, `deskripsi`, `tipe`, `opsi`, `wajib`, `is_active`) VALUES (1,1,'kecerdasan_umum','KEMAMPUAN UMUM',1,'Kecerdasan Umum','Kapasitas berpikir yang dimiliki dalam menerima dan mengolah informasi','skala',NULL,1,1),
(2,1,'wawasan_pengetahuan','KEMAMPUAN UMUM',2,'Wawasan Pengetahuan','Pengetahuan umum yang dimiliki','skala',NULL,1,1),
(3,1,'kemampuan_verbal','KEMAMPUAN UMUM',3,'Kemampuan Verbal','Kemampuan merespon informasi yang bersifat verbal atau kata-kata','skala',NULL,1,1),
(4,1,'kemampuan_non_verbal','KEMAMPUAN UMUM',4,'Kemampuan Non-Verbal','Kemampuan merespon informasi yang bersifat non verbal seperti simbol, gambar, diagram','skala',NULL,1,1),
(5,1,'kemampuan_logika_berpikir','KEMAMPUAN UMUM',5,'Kemampuan Logika Berpikir','Kemampuan memahami dan menangkap hubungan antara dua hal sehingga memungkinkan untuk menemukan alternatif solusi pemecahan masalah','skala',NULL,1,1),
(6,1,'kemampuan_numerik','KEMAMPUAN UMUM',6,'Kemampuan Numerik','Kemampuan dalam merespon informasi yang bersifat angka dan hitungan','skala',NULL,1,1),
(7,1,'daya_ingat','POTENSI BELAJAR',7,'Daya Ingat','Kemampuan menyimpan informasi & memprosesnya kembali untuk digunakan','skala',NULL,1,1),
(8,1,'konsentrasi','POTENSI BELAJAR',8,'Konsentrasi','Kemampuan dalam mempertahankan perhatian (fokus) saat mengerjakan tugas','skala',NULL,1,1),
(9,1,'sistematika','POTENSI BELAJAR',9,'Sistematika','Kemampuan menyelesaikan tugas secara teratur dan terencana','skala',NULL,1,1),
(10,1,'stabilitas_emosi','KEPRIBADIAN',10,'Stabilitas Emosi','Kemampuan untuk mengontrol emosi dalam menghadapi tekanan baik dari dalam maupun dari luar dirinya','skala',NULL,1,1),
(11,1,'kepercayaan_diri','KEPRIBADIAN',11,'Kepercayaan Diri','Kepercayaan akan potensi dan kemampuan yang dimiliki','skala',NULL,1,1),
(12,1,'hubungan_interpersonal','KEPRIBADIAN',12,'Hubungan Interpersonal','Kemampuan dalam berinteraksi dengan lingkungan baru dan menjalin relasi sosial','skala',NULL,1,1),
(13,1,'kerjasama','KEPRIBADIAN',13,'Kerjasama','Kemampuan dalam mematuhi aturan dan bekerjasama dengan lingkungan untuk tujuan bersama','skala',NULL,1,1),
(14,1,'hasrat_berprestasi','KEPRIBADIAN',14,'Hasrat Berprestasi','Semangat / dorongan untuk terus meraih prestasi maksimal sesuai kemampuan','skala',NULL,1,1),
(15,1,'iq','KESIMPULAN',15,'IQ','Skor IQ, contoh: 105','teks',NULL,1,1),
(16,1,'skala_iq','KESIMPULAN',16,'Skala IQ','Alat ukur, contoh: WISC / CFIT','teks',NULL,1,1),
(17,1,'kategori_iq','KESIMPULAN',17,'Kesimpulan Taraf Kecerdasan','Contoh: Rata-rata','teks',NULL,1,1),
(18,1,'kelebihan','KESIMPULAN',18,'Kelebihan',NULL,'teks',NULL,1,1),
(19,1,'kekurangan','KESIMPULAN',19,'Kekurangan',NULL,'teks',NULL,1,1),
(20,1,'saran','KESIMPULAN',20,'Saran',NULL,'teks',NULL,1,1),
(21,2,'kecerdasan_umum','INTELEKTUAL',1,'Kecerdasan Umum','Kemampuan untuk memahami dan memberikan alternatif solusi terhadap suatu permasalahan secara tepat','skala',NULL,1,1),
(22,2,'kemampuan_penalaran','INTELEKTUAL',2,'Kemampuan Penalaran','Kemampuan khusus untuk berpikir secara logis sistematis dan melakukan penalaran secara rasional','skala',NULL,1,1),
(23,2,'kemampuan_berhitung','INTELEKTUAL',3,'Kemampuan Berhitung','Kemampuan khusus untuk menyelesaikan persoalan-persoalan yang disajikan dalam bentuk angka-angka dan hitungan','skala',NULL,1,1),
(24,2,'kemampuan_verbal','INTELEKTUAL',4,'Kemampuan Verbal','Kemampuan khusus untuk memahami persoalan-persoalan yang disajikan secara verbal atau bahasa','skala',NULL,1,1),
(25,2,'daya_ingat','INTELEKTUAL',5,'Daya Ingat','Kemampuan mengingat kembali informasi dan memunculkannya kembali secara cepat dan akurat','skala',NULL,1,1),
(26,2,'daya_analisa_sintesa','INTELEKTUAL',6,'Daya Analisa Sintesa','Kemampuan menguraikan masalah menjadi bagian-bagian, serta kemampuan mengintegrasikan data-data untuk memecahkan suatu persoalan','skala',NULL,1,1),
(27,2,'cara_berpikir_fleksibel','INTELEKTUAL',7,'Cara Berpikir Fleksibel','Kemampuan berpikir secara fleksibel dan menemukan alternatif pemecahan masalah','skala',NULL,1,1),
(28,2,'cara_berpikir_eksak','INTELEKTUAL',8,'Cara Berpikir Eksak','Kemampuan untuk menyelesaikan tugas-tugas yang memiliki penyelesaian baku','skala',NULL,1,1),
(29,2,'taraf_kecerdasan','KESIMPULAN',9,'Taraf Kecerdasan (IQ)','Contoh: IQ 110 (Rata-rata Atas)','teks',NULL,1,1),
(30,2,'minat_bakat','KESIMPULAN',10,'Minat Bakat',NULL,'teks',NULL,1,1),
(31,2,'rekomendasi_jurusan','KESIMPULAN',11,'Rekomendasi Jurusan',NULL,'teks',NULL,1,1),
(32,2,'rekomendasi_jurusan_kuliah','KESIMPULAN',12,'Rekomendasi Jurusan Kuliah',NULL,'teks',NULL,0,1),
(33,3,'jabatan','IDENTITAS',1,'Jabatan yang Dilamar',NULL,'teks',NULL,1,1),
(34,3,'excellence','ASPEK PSIKOLOGIS',2,'Excellence','Usaha dalam mencapai prestasi terbaik disertai penjagaan kualitas melalui suatu sistem yang terpadu dan berkesinambungan','skala',NULL,1,1),
(35,3,'team_work','ASPEK PSIKOLOGIS',3,'Team work','Mengembangkan lingkungan kerja yang sehat dan saling bersinergi antar seluruh jajaran','skala',NULL,1,1),
(36,3,'appearance','ASPEK PSIKOLOGIS',4,'Appearance','Menampilkan diri dengan sikap dan perilaku yang santun','skala',NULL,1,1),
(37,3,'verbal_communication','ASPEK PSIKOLOGIS',5,'Verbal Communication','Keterampilan menyampaikan pesan secara efektif','skala',NULL,1,1),
(38,3,'achievement_motivation','ASPEK PSIKOLOGIS',6,'Achievement Motivation','Dorongan untuk mencapai suatu tujuan','skala',NULL,1,1),
(39,3,'accuracy_and_attention_to_detail','ASPEK PSIKOLOGIS',7,'Accuracy and Attention to Detail','Kemampuan untuk bekerja dengan teliti dan detil','skala',NULL,1,1),
(40,3,'stress_tolerance','ASPEK PSIKOLOGIS',8,'Stress Tolerance','Kemampuan mempertahankan kinerja dalam berbagai situasi','skala',NULL,1,1),
(41,3,'emotional_stability','ASPEK PSIKOLOGIS',9,'Emotional Stability','Kemampuan mengelola emosi yang dimiliki untuk menunjang kinerja','skala',NULL,1,1),
(42,3,'initiative','ASPEK PSIKOLOGIS',10,'Initiative','Kemampuan mengambil tindakan yang diperlukan','skala',NULL,1,1),
(43,3,'self_confidence','ASPEK PSIKOLOGIS',11,'Self Confidence','Kepercayaan terhadap kemampuan diri sendiri','skala',NULL,1,1),
(44,3,'adaptability','ASPEK PSIKOLOGIS',12,'Adaptability','Kemampuan menyesuaikan diri dengan tuntutan kerja dalam berbagai situasi','skala',NULL,1,1),
(45,3,'interpersonal_relationship','ASPEK PSIKOLOGIS',13,'Interpersonal Relationship','Kemampuan membangun & menjalin relasi dengan orang lain','skala',NULL,1,1),
(46,3,'strategic_influence','KOMPETENSI MANAJERIAL',14,'Strategic Influence','Strategi berpikir dalam menyelesaikan pekerjaan termasuk cara mengatasi hambatan secara efektif dan efisien','skala',NULL,1,1),
(47,3,'analythical_thinking','KOMPETENSI MANAJERIAL',15,'Analytical Thinking','Kemampuan untuk memahami situasi dengan cara menguraikan masalah dan memetakannya menjadi bagian-bagian yang lebih rinci','skala',NULL,1,1),
(48,3,'decisiveness','KOMPETENSI MANAJERIAL',16,'Decisiveness','Kemampuan dalam menentukan sikap dan mengambil suatu keputusan secara tegas, cepat dan tepat','skala',NULL,1,1),
(49,3,'team_leadership','KOMPETENSI MANAJERIAL',17,'Team Leadership','Kemampuan mengelola dan memimpin kelompok untuk mencapai visi dan misi perusahaan','skala',NULL,1,1),
(50,3,'uraian','KESIMPULAN',18,'Description / Uraian',NULL,'teks',NULL,1,1),
(51,3,'kelebihan','KESIMPULAN',19,'Strength / Kelebihan',NULL,'teks',NULL,1,1),
(52,3,'kekurangan','KESIMPULAN',20,'Weakness / Kekurangan',NULL,'teks',NULL,1,1),
(53,3,'rekomendasi_uraian','KESIMPULAN',21,'Recommendation','Uraian rekomendasi','teks',NULL,1,1),
(54,3,'rekomendasi','KESIMPULAN',22,'Kesimpulan Rekomendasi',NULL,'pilihan','Dapat Disarankan;Masih Dapat Disarankan;Kurang Dapat Disarankan;Tidak Dapat Disarankan',1,1),
(55,4,'general_intelligence','INTELEKTUAL',1,'General Intelligence','Kemampuan untuk memahami dan memberikan alternatif solusi terhadap suatu permasalahan secara tepat. Isi: IQ = skor (kategori)','teks',NULL,1,1),
(56,4,'initiative','SIKAP KERJA',2,'Initiative','Kemampuan seseorang untuk memulai tindakan secara mandiri tanpa harus menunggu perintah atau dorongan dari orang lain','skala',NULL,1,1),
(57,4,'work_speed','SIKAP KERJA',3,'Work Speed','Kemampuan bekerja secara cepat sesuai dengan target yang telah ditentukan','skala',NULL,1,1),
(58,4,'work_accuracy','SIKAP KERJA',4,'Work Accuracy','Kemampuan bekerja secara tepat dan akurat sesuai dengan data empiris','skala',NULL,1,1),
(59,4,'work_diligence','SIKAP KERJA',5,'Work Diligence','Kemampuan seseorang untuk terus berusaha secara konsisten dalam mencapai tujuan','skala',NULL,1,1),
(60,4,'work_endurance','SIKAP KERJA',6,'Work Endurance','Kemampuan individu untuk mempertahankan kinerja, energi, dan konsentrasi secara konsisten dalam jangka waktu yang relatif lama, terutama ketika menghadapi tuntutan pekerjaan yang tinggi, berulang, atau melelahkan','skala',NULL,1,1),
(61,4,'emotional_stability','KEPRIBADIAN',7,'Emotional Stability','Kemampuan untuk mengontrol emosi dalam menghadapi tekanan baik dari dalam maupun dari luar dirinya','skala',NULL,1,1),
(62,4,'self_confidence','KEPRIBADIAN',8,'Self Confidence','Kepercayaan akan potensi dan kemampuan yang dimiliki','skala',NULL,1,1),
(63,4,'social_adaptation','KEPRIBADIAN',9,'Social Adaptation','Kemampuan untuk menyesuaikan diri dengan lingkungan sekitar','skala',NULL,1,1),
(64,4,'hubungan_interpersonal','KEPRIBADIAN',10,'Hubungan Interpersonal','Kemampuan menjalin hubungan yang positif dengan orang lain','skala',NULL,1,1),
(65,4,'work_collaboration','KEPRIBADIAN',11,'Work Collaboration','Kemampuan bekerjasama dengan semua lini','skala',NULL,1,1),
(66,4,'communication_skill','KEPRIBADIAN',12,'Communication Skill','Kemampuan menyampaikan ide dan pendapatnya baik secara lisan maupun tulisan','skala',NULL,1,1),
(67,4,'need_of_achievement','KEBUTUHAN',13,'Need Of Achievement','Semangat / dorongan untuk terus meraih prestasi maksimal sesuai kemampuan','skala',NULL,1,1),
(68,4,'need_of_deference','KEBUTUHAN',14,'Need Of Deference','Kebutuhan akan dihargai dan menghargai orang lain','skala',NULL,1,1),
(69,4,'need_of_order','KEBUTUHAN',15,'Need Of Order','Melakukan segala sesuatu secara teratur dan terencana','skala',NULL,1,1),
(70,4,'need_of_exhibition','KEBUTUHAN',16,'Need Of Exhibition','Kebutuhan untuk menonjolkan diri','skala',NULL,1,1),
(71,4,'need_of_autonomy','KEBUTUHAN',17,'Need Of Autonomy','Kebutuhan untuk bebas dan mandiri','skala',NULL,1,1),
(72,4,'need_of_affiliation','KEBUTUHAN',18,'Need Of Affiliation','Kebutuhan untuk berinteraksi dengan orang lain dan lingkungan baru','skala',NULL,1,1),
(73,4,'need_of_interception','KEBUTUHAN',19,'Need Of Interception','Kebutuhan/keinginan untuk memahami orang lain','skala',NULL,1,1),
(74,4,'need_of_succorance','KEBUTUHAN',20,'Need Of Succorance','Mencari perhatian dan simpati','skala',NULL,1,1),
(75,4,'need_of_dominance','KEBUTUHAN',21,'Need Of Dominance','Keinginan untuk mendominasi dan mengarahkan orang lain','skala',NULL,1,1),
(76,4,'need_of_abasement','KEBUTUHAN',22,'Need Of Abasement','Merasa rendah diri dan merasa sangat bersalah ketika melakukan kesalahan','skala',NULL,1,1),
(77,4,'need_of_nurturance','KEBUTUHAN',23,'Need Of Nurturance','Keinginan untuk berbuat baik dan membantu orang lain','skala',NULL,1,1),
(78,4,'need_of_change','KEBUTUHAN',24,'Need Of Change','Kebutuhan untuk berubah, menerima tantangan dan kebiasaan baru','skala',NULL,1,1),
(79,4,'need_of_endurance','KEBUTUHAN',25,'Need Of Endurance','Bertahan untuk menyelesaikan tugas hingga tuntas','skala',NULL,1,1),
(80,4,'need_of_heterosexuality','KEBUTUHAN',26,'Need Of Heterosexuality','Kebutuhan untuk memperhatikan dan diperhatikan oleh lawan jenis','skala',NULL,1,1),
(81,4,'need_of_aggression','KEBUTUHAN',27,'Need Of Aggression','Kebutuhan akan menyatakan pendapat/pandangan yang berbeda, mengecam orang lain','skala',NULL,1,1),
(82,4,'kesimpulan','KESIMPULAN',28,'Kesimpulan dan Saran',NULL,'teks',NULL,1,1),
(83,4,'rekomendasi','KESIMPULAN',29,'Kesimpulan',NULL,'pilihan','Disarankan;Masih Disarankan;Tidak Disarankan',1,1);
INSERT INTO `layanan` (`id_layanan`, `nama_layanan`, `kategori`, `deskripsi`, `harga`, `durasi_menit`, `jenis_intake`, `id_template`, `is_active`, `created_at`, `updated_at`) VALUES (1,'Tes Psikologi Anak','Anak dan Remaja','Pemeriksaan kecerdasan, potensi belajar, dan kepribadian anak.',350000.00,120,'Anak',1,1,'2026-10-09 22:20:14','2026-10-09 22:20:14'),
(2,'Tes Minat Bakat & Penjurusan','Anak dan Remaja','Pemetaan minat, bakat, dan rekomendasi jurusan sekolah/kuliah.',300000.00,120,'Dewasa',2,1,'2026-10-09 22:20:14','2026-10-09 22:20:14'),
(3,'Asesmen Rekrutmen Karyawan','Industri','Asesmen psikologis untuk seleksi dan penempatan karyawan.',400000.00,180,'Dewasa',3,1,'2026-10-09 22:20:14','2026-10-09 22:20:14'),
(4,'Psikotes Umum','Masyarakat Umum','Pemeriksaan psikologis umum (kecerdasan, sikap kerja, kepribadian).',300000.00,150,'Dewasa',4,1,'2026-10-09 22:20:14','2026-10-09 22:20:14'),
(5,'Konseling Individu','Masyarakat Umum','Sesi konseling psikologi individual bersama psikolog.',250000.00,60,'Dewasa',NULL,1,'2026-10-09 22:20:14','2026-10-09 22:20:14');
INSERT INTO `layanan_fee` (`id_layanan_fee`, `id_layanan`, `id_kategori_fee`, `nominal`) VALUES (1,1,2,50000.00),
(2,1,5,50000.00),
(3,1,8,100000.00),
(4,2,2,50000.00),
(5,2,5,50000.00),
(6,2,8,100000.00),
(7,3,3,75000.00),
(8,3,6,75000.00),
(9,3,8,100000.00),
(10,4,2,50000.00),
(11,4,5,50000.00),
(12,4,8,100000.00),
(13,5,11,150000.00);
INSERT INTO `sequelize_meta` (`name`) VALUES ('20261009000001-initial-schema.js'),('20261009000002-ulasan.js');
INSERT INTO `sequelize_data` (`name`) VALUES ('20261009000001-master-data.js');

SET FOREIGN_KEY_CHECKS = 1;
