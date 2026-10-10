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
