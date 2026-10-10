/**
 * Registrasi semua model dan relasi antar tabel.
 */
const sequelize = require('../config/database');

const names = [
  'User', 'PasswordReset', 'Klien', 'Psikolog', 'TemplateLaporan', 'TemplateItem', 'Layanan',
  'KategoriFee', 'LayananFee', 'Pengaturan', 'IntakeDewasa', 'KeluargaKlien', 'RiwayatOrganisasi',
  'ReferensiKlien', 'IntakeAnak', 'RiwayatKelahiranAsi', 'RiwayatPerkembanganAnak',
  'RiwayatPendidikanSosialAnak', 'JadwalPsikolog', 'SesiAsesmen', 'Pembayaran', 'AnamnesisSesi',
  'ObservasiMental', 'CatatanSoap', 'LaporanAsesmen', 'JawabanLaporan', 'RekapFee', 'Pengeluaran',
  'Notifikasi', 'AuditLog', 'Ulasan',
];

const db = {};
for (const name of names) {
  db[name] = require(`./${name}`)(sequelize);
}

const {
  User, PasswordReset, Klien, Psikolog, TemplateLaporan, TemplateItem, Layanan, KategoriFee, LayananFee,
  IntakeDewasa, KeluargaKlien, RiwayatOrganisasi, ReferensiKlien, IntakeAnak, RiwayatKelahiranAsi,
  RiwayatPerkembanganAnak, RiwayatPendidikanSosialAnak, JadwalPsikolog, SesiAsesmen, Pembayaran,
  AnamnesisSesi, ObservasiMental, CatatanSoap, LaporanAsesmen, JawabanLaporan, RekapFee, Pengeluaran,
  Notifikasi, AuditLog, Ulasan,
} = db;

const fk = (name) => ({ foreignKey: name });

// Akun
User.hasMany(Klien, { ...fk('id_user'), as: 'profilKlien' });
Klien.belongsTo(User, { ...fk('id_user'), as: 'akun' });
User.hasOne(Psikolog, { ...fk('id_user'), as: 'psikolog' });
Psikolog.belongsTo(User, { ...fk('id_user'), as: 'akun' });
User.hasMany(PasswordReset, fk('id_user'));
PasswordReset.belongsTo(User, fk('id_user'));

// Template & layanan
TemplateLaporan.hasMany(TemplateItem, { ...fk('id_template'), as: 'items' });
TemplateItem.belongsTo(TemplateLaporan, { ...fk('id_template'), as: 'template' });
TemplateLaporan.hasMany(Layanan, fk('id_template'));
Layanan.belongsTo(TemplateLaporan, { ...fk('id_template'), as: 'template' });
Layanan.hasMany(LayananFee, { ...fk('id_layanan'), as: 'tarifFee' });
LayananFee.belongsTo(Layanan, fk('id_layanan'));
KategoriFee.hasMany(LayananFee, fk('id_kategori_fee'));
LayananFee.belongsTo(KategoriFee, { ...fk('id_kategori_fee'), as: 'kategori' });

// Intake klien
Klien.hasOne(IntakeDewasa, { ...fk('id_klien'), as: 'intakeDewasa' });
IntakeDewasa.belongsTo(Klien, fk('id_klien'));
Klien.hasMany(KeluargaKlien, { ...fk('id_klien'), as: 'keluarga' });
KeluargaKlien.belongsTo(Klien, fk('id_klien'));
Klien.hasMany(RiwayatOrganisasi, { ...fk('id_klien'), as: 'organisasi' });
RiwayatOrganisasi.belongsTo(Klien, fk('id_klien'));
Klien.hasMany(ReferensiKlien, { ...fk('id_klien'), as: 'referensi' });
ReferensiKlien.belongsTo(Klien, fk('id_klien'));
Klien.hasOne(IntakeAnak, { ...fk('id_klien'), as: 'intakeAnak' });
IntakeAnak.belongsTo(Klien, fk('id_klien'));
IntakeAnak.hasOne(RiwayatKelahiranAsi, { ...fk('id_intake_anak'), as: 'kelahiran' });
IntakeAnak.hasOne(RiwayatPerkembanganAnak, { ...fk('id_intake_anak'), as: 'perkembangan' });
IntakeAnak.hasOne(RiwayatPendidikanSosialAnak, { ...fk('id_intake_anak'), as: 'pendidikanSosial' });
RiwayatKelahiranAsi.belongsTo(IntakeAnak, fk('id_intake_anak'));
RiwayatPerkembanganAnak.belongsTo(IntakeAnak, fk('id_intake_anak'));
RiwayatPendidikanSosialAnak.belongsTo(IntakeAnak, fk('id_intake_anak'));

// Jadwal & sesi
Psikolog.hasMany(JadwalPsikolog, { ...fk('id_psikolog'), as: 'jadwal' });
JadwalPsikolog.belongsTo(Psikolog, { ...fk('id_psikolog'), as: 'psikolog' });
JadwalPsikolog.hasOne(SesiAsesmen, { ...fk('id_jadwal'), as: 'sesi' });
SesiAsesmen.belongsTo(JadwalPsikolog, { ...fk('id_jadwal'), as: 'jadwal' });
Klien.hasMany(SesiAsesmen, { ...fk('id_klien'), as: 'sesi' });
SesiAsesmen.belongsTo(Klien, { ...fk('id_klien'), as: 'klien' });
Psikolog.hasMany(SesiAsesmen, { ...fk('id_psikolog'), as: 'sesi' });
SesiAsesmen.belongsTo(Psikolog, { ...fk('id_psikolog'), as: 'psikolog' });
Layanan.hasMany(SesiAsesmen, fk('id_layanan'));
SesiAsesmen.belongsTo(Layanan, { ...fk('id_layanan'), as: 'layanan' });
SesiAsesmen.belongsTo(User, { foreignKey: 'dibuat_oleh', as: 'pembuat' });

SesiAsesmen.hasOne(Pembayaran, { ...fk('id_sesi'), as: 'pembayaran' });
Pembayaran.belongsTo(SesiAsesmen, { ...fk('id_sesi'), as: 'sesi' });
Pembayaran.belongsTo(User, { foreignKey: 'diverifikasi_oleh', as: 'verifikator' });

SesiAsesmen.hasOne(AnamnesisSesi, { ...fk('id_sesi'), as: 'anamnesis' });
SesiAsesmen.hasOne(ObservasiMental, { ...fk('id_sesi'), as: 'observasi' });
SesiAsesmen.hasOne(CatatanSoap, { ...fk('id_sesi'), as: 'soap' });
AnamnesisSesi.belongsTo(SesiAsesmen, fk('id_sesi'));
ObservasiMental.belongsTo(SesiAsesmen, fk('id_sesi'));
CatatanSoap.belongsTo(SesiAsesmen, fk('id_sesi'));

// Laporan
SesiAsesmen.hasOne(LaporanAsesmen, { ...fk('id_sesi'), as: 'laporan' });
LaporanAsesmen.belongsTo(SesiAsesmen, { ...fk('id_sesi'), as: 'sesi' });
LaporanAsesmen.belongsTo(TemplateLaporan, { ...fk('id_template'), as: 'template' });
LaporanAsesmen.hasMany(JawabanLaporan, { ...fk('id_laporan'), as: 'jawaban' });
JawabanLaporan.belongsTo(LaporanAsesmen, fk('id_laporan'));
JawabanLaporan.belongsTo(TemplateItem, { ...fk('id_item'), as: 'item' });

// Keuangan
SesiAsesmen.hasMany(RekapFee, { ...fk('id_sesi'), as: 'fee' });
RekapFee.belongsTo(SesiAsesmen, { ...fk('id_sesi'), as: 'sesi' });
Psikolog.hasMany(RekapFee, { ...fk('id_psikolog'), as: 'fee' });
RekapFee.belongsTo(Psikolog, { ...fk('id_psikolog'), as: 'psikolog' });
RekapFee.belongsTo(KategoriFee, { ...fk('id_kategori_fee'), as: 'kategori' });
Pengeluaran.belongsTo(User, { foreignKey: 'dicatat_oleh', as: 'pencatat' });

// Notifikasi & audit
User.hasMany(Notifikasi, fk('id_user'));
Notifikasi.belongsTo(User, fk('id_user'));
Notifikasi.belongsTo(SesiAsesmen, { ...fk('id_sesi'), as: 'sesi' });
AuditLog.belongsTo(User, { ...fk('id_user'), as: 'user' });

// Ulasan
SesiAsesmen.hasOne(Ulasan, { ...fk('id_sesi'), as: 'ulasan' });
Ulasan.belongsTo(SesiAsesmen, { ...fk('id_sesi'), as: 'sesi' });
Ulasan.belongsTo(Klien, { ...fk('id_klien'), as: 'klien' });
Ulasan.belongsTo(Psikolog, { ...fk('id_psikolog'), as: 'psikolog' });
Psikolog.hasMany(Ulasan, { ...fk('id_psikolog'), as: 'ulasan' });

db.sequelize = sequelize;
module.exports = db;
