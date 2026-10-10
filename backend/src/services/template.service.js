/**
 * Kelola template laporan (Admin): data template, item/aspek psikogram, upload file .docx baru,
 * dan panduan placeholder. Setiap upload file menaikkan versi; file lama tetap disimpan.
 */
const fs = require('fs');
const path = require('path');
const { sequelize, TemplateLaporan, TemplateItem, JawabanLaporan, Layanan } = require('../models');
const AppError = require('../utils/AppError');
const pick = require('../utils/pick');
const dokumen = require('./dokumen.service');

const META_FIELDS = ['nama_template', 'deskripsi', 'skala_min', 'skala_max', 'keterangan_skala', 'is_active'];
const ITEM_FIELDS = ['kode', 'kelompok', 'urutan', 'label', 'deskripsi', 'tipe', 'opsi', 'wajib', 'is_active'];

const PLACEHOLDER_UMUM = {
  nama: 'Nama lengkap klien', nomor_rekam_psikologi: 'Nomor rekam psikologi', jenis_kelamin: 'Jenis kelamin',
  tempat_lahir: 'Tempat lahir', tanggal_lahir: 'Tanggal lahir (format Indonesia)', tempat_tanggal_lahir: 'Tempat, tanggal lahir',
  usia: 'Usia saat tes (tahun & bulan)', alamat: 'Alamat rumah', pendidikan: 'Pendidikan terakhir / sekolah', pekerjaan: 'Pekerjaan',
  sekolah: 'Nama sekolah / kelas (intake anak)', ayah_nama: 'Nama ayah', ayah_pendidikan: 'Pendidikan ayah', ayah_pekerjaan: 'Pekerjaan ayah',
  ibu_nama: 'Nama ibu', ibu_pendidikan: 'Pendidikan ibu', ibu_pekerjaan: 'Pekerjaan ibu', alamat_orang_tua: 'Alamat orang tua',
  no_tes: 'Nomor tes (kode booking)', layanan: 'Nama layanan', tanggal_tes: 'Tanggal pemeriksaan', tanggal_laporan: 'Tanggal laporan dibuat',
  kota: 'Kota penandatanganan', psikolog_nama: 'Nama psikolog + gelar', psikolog_sipp: 'Nomor SIPP', psikolog_str: 'Nomor STR (opsional)',
};

async function list() {
  return TemplateLaporan.findAll({
    attributes: { include: [[sequelize.literal('(SELECT COUNT(*) FROM template_item i WHERE i.id_template = TemplateLaporan.id_template AND i.is_active = 1)'), 'jumlah_item']] },
    order: [['id_template', 'ASC']],
  });
}

async function detail(id) {
  const t = await TemplateLaporan.findByPk(id, {
    include: [{ model: TemplateItem, as: 'items' }],
    order: [[{ model: TemplateItem, as: 'items' }, 'urutan', 'ASC']],
  });
  if (!t) throw AppError.notFound('Template tidak ditemukan');
  return t;
}

async function create(data) {
  return sequelize.transaction(async (t) => {
    const tpl = await TemplateLaporan.create({ kode: data.kode, ...pick(data, META_FIELDS) }, { transaction: t });
    if (Array.isArray(data.items) && data.items.length) {
      await TemplateItem.bulkCreate(data.items.map((it, i) => ({ urutan: i + 1, ...pick(it, ITEM_FIELDS), id_template: tpl.id_template })), { transaction: t, validate: true });
    }
    return tpl;
  }).then((tpl) => detail(tpl.id_template));
}

async function update(id, data) {
  const t = await TemplateLaporan.findByPk(id);
  if (!t) throw AppError.notFound('Template tidak ditemukan');
  const values = pick(data, META_FIELDS);
  const min = values.skala_min ?? t.skala_min;
  const max = values.skala_max ?? t.skala_max;
  if (max <= min) throw AppError.badRequest('Skala maksimum harus lebih besar dari skala minimum');
  await t.update(values);
  return detail(id);
}

async function remove(id) {
  const t = await TemplateLaporan.findByPk(id);
  if (!t) throw AppError.notFound('Template tidak ditemukan');
  const dipakai = await sequelize.query('SELECT COUNT(*) AS n FROM laporan_asesmen WHERE id_template = ?', { replacements: [id], type: sequelize.QueryTypes.SELECT });
  if (Number(dipakai[0].n) > 0) {
    await t.update({ is_active: false });
    return { dihapus: false, dinonaktifkan: true };
  }
  await Layanan.update({ id_template: null }, { where: { id_template: id } });
  await t.destroy();
  return { dihapus: true, dinonaktifkan: false };
}

async function addItem(idTemplate, data) {
  await detail(idTemplate);
  if (data.tipe === 'pilihan' && !data.opsi) throw AppError.badRequest('Item pilihan wajib memiliki opsi');
  return TemplateItem.create({ ...pick(data, ITEM_FIELDS), id_template: idTemplate });
}

async function updateItem(idTemplate, idItem, data) {
  const it = await TemplateItem.findOne({ where: { id_item: idItem, id_template: idTemplate } });
  if (!it) throw AppError.notFound('Item tidak ditemukan');
  const values = pick(data, ITEM_FIELDS);
  if (values.tipe && values.tipe !== it.tipe && await JawabanLaporan.count({ where: { id_item: idItem } })) {
    throw AppError.conflict('Tipe item tidak dapat diubah karena sudah dipakai di laporan');
  }
  return it.update(values);
}

async function removeItem(idTemplate, idItem) {
  const it = await TemplateItem.findOne({ where: { id_item: idItem, id_template: idTemplate } });
  if (!it) throw AppError.notFound('Item tidak ditemukan');
  if (await JawabanLaporan.count({ where: { id_item: idItem } })) {
    await it.update({ is_active: false });
    return { dihapus: false, dinonaktifkan: true };
  }
  await it.destroy();
  return { dihapus: true, dinonaktifkan: false };
}

/** Daftar placeholder yang dapat dipakai pada file .docx template ini. */
async function panduanPlaceholder(id) {
  const t = await detail(id);
  const items = t.items.filter((i) => i.is_active);
  const skala = items.filter((i) => i.tipe === 'skala');
  const kelompok = [...new Set(skala.map((i) => i.kelompok))];
  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const kolom = Array.from({ length: t.skala_max }, (_, i) => `{c${i + 1}}`).join(' ');
  return {
    sintaks: 'Tulis placeholder dengan kurung kurawal, contoh {nama}. Untuk tabel berulang, letakkan {#nama_loop} di sel pertama dan {/nama_loop} di sel terakhir baris.',
    identitas: Object.entries(PLACEHOLDER_UMUM).map(([k, v]) => ({ placeholder: `{${k}}`, keterangan: v })),
    isian: items.filter((i) => i.tipe !== 'skala').map((i) => ({
      placeholder: `{${i.kode}}`, keterangan: i.label,
      ...(i.tipe === 'pilihan' ? { tanda_centang: (i.opsi || '').split(';').map((o) => `{p_${i.kode}_${slug(o)}}`) } : {}),
    })),
    nilai_aspek: skala.map((i) => ({ placeholder: `{${i.kode}}`, keterangan: `Nilai angka ${i.label}` })),
    tabel_psikogram: {
      semua_kelompok: `{#kelompok}{nama_kelompok} ... {#items}{no} {label} {label_kapital} {deskripsi} ${kolom}{/items}{/kelompok}`,
      tanpa_kelompok: `{#items}{no} {label} {deskripsi} ${kolom}{/items}`,
      per_kelompok: kelompok.map((k) => `{#grup_${slug(k)}} ... {/grup_${slug(k)}}`),
      keterangan_kolom: `{c1}..{c${t.skala_max}} berisi tanda √ pada kolom nilai yang dipilih`,
    },
  };
}

/** Upload file template .docx baru (sudah dibatasi ekstensi & ukuran oleh middleware upload). */
async function uploadFile(id, file) {
  if (!file) throw AppError.badRequest('File template wajib diunggah (field: file)');
  try {
    const t = await TemplateLaporan.findByPk(id);
    if (!t) throw AppError.notFound('Template tidak ditemukan');
    const { tags } = dokumen.validateTemplate(file.path);
    const versi = t.file_docx ? t.versi + 1 : t.versi;
    const fileName = `${t.kode}_v${versi}.docx`;
    fs.renameSync(file.path, dokumen.safeJoin(dokumen.DIR.template, fileName));
    await t.update({ file_docx: fileName, versi });
    return { template: await detail(id), placeholder_terdeteksi: tags };
  } finally {
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
  }
}

async function fileTemplate(id) {
  const t = await TemplateLaporan.findByPk(id);
  if (!t || !t.file_docx) throw AppError.notFound('File template belum tersedia');
  const p = dokumen.safeJoin(dokumen.DIR.template, t.file_docx);
  if (!fs.existsSync(p)) throw AppError.notFound('File template tidak ditemukan di server');
  return { path: p, name: path.basename(p) };
}

module.exports = { list, detail, create, update, remove, addItem, updateItem, removeItem, panduanPlaceholder, uploadFile, fileTemplate };
