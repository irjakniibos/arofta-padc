const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Klien', {
  id_klien: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_user: { type: DataTypes.INTEGER, allowNull: false },
  hubungan_akun: { type: DataTypes.ENUM('Diri Sendiri', 'Anak', 'Lainnya'), allowNull: false, defaultValue: 'Diri Sendiri' },
  nomor_rekam_psikologi: { type: DataTypes.STRING(30), unique: true },
  nama_lengkap: { type: DataTypes.STRING(150), allowNull: false },
  jenis_kelamin: DataTypes.ENUM('Laki-laki', 'Perempuan'),
  tempat_lahir: DataTypes.STRING(100),
  tanggal_lahir: DataTypes.DATEONLY,
  alamat_rumah: DataTypes.TEXT,
  no_hp: DataTypes.STRING(20),
  agama: DataTypes.STRING(50),
  kewarganegaraan: DataTypes.STRING(50),
  suku_bangsa: DataTypes.STRING(50),
  pendidikan_terakhir: DataTypes.STRING(100),
  pekerjaan: DataTypes.STRING(100),
  status_pernikahan: DataTypes.ENUM('Belum Menikah', 'Menikah', 'Bercerai', 'Janda', 'Duda'),
  tahun_menikah: DataTypes.SMALLINT,
}, { tableName: 'klien' });
