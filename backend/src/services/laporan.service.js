/**
 * Laporan hasil pemeriksaan berbasis template (KF-11..14):
 * psikolog mengisi item template -> simpan draft -> finalisasi -> sistem mengisi file .docx
 * klinik -> konversi PDF -> klien menerima notifikasi dan dapat mengunduh.
 */
const fs = require('fs');
const path = require('path');
const env = require('../config/env');
const {
  sequelize, SesiAsesmen, LaporanAsesmen, JawabanLaporan, TemplateLaporan, TemplateItem, Klien, Psikolog, Layanan,
  IntakeAnak, KeluargaKlien, Ulasan,
} = require('../models');
const { STATUS_LAPORAN, STATUS_SESI, TIPE_NOTIF, ROLES, STAFF_ROLES } = require('../config/constants');
const AppError = require('../utils/AppError');
const { getPagination, buildMeta } = require('../utils/pagination');
const { formatTanggalIndo, hitungUsia, toDateString } = require('../utils/date');
const dokumen = require('./dokumen.service');
const notif = require('./notifikasi.service');

const slug = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

async function loadSesi(idSesi, scope = {}) {
  const sesi = await SesiAsesmen.findOne({
    where: { id_sesi: idSesi, ...scope },
    include: [
      { model: Layanan, as: 'layanan', attributes: ['id_layanan', 'nama_layanan', 'id_template'] },
      { model: Klien, as: 'klien' },
      { model: Psikolog, as: 'psikolog' },
      { model: LaporanAsesmen, as: 'laporan' },
    ],
  });
  if (!sesi) throw AppError.notFound('Sesi tidak ditemukan');
  return sesi;
}

async function loadTemplate(idTemplate) {
  const t = await TemplateLaporan.findByPk(idTemplate, {
    include: [{ model: TemplateItem, as: 'items', where: { is_active: true }, required: false }],
    order: [[{ model: TemplateItem, as: 'items' }, 'urutan', 'ASC']],
  });
  if (!t) throw AppError.notFound('Template laporan tidak ditemukan');
  return t;
}

/** Template yang dipakai: yang sudah tersimpan di laporan, atau template default layanan. */
function templateIdFor(sesi, requested) {
  if (sesi.laporan && sesi.laporan.id_template) return sesi.laporan.id_template;
  if (requested) return requested;
  if (sesi.layanan.id_template) return sesi.layanan.id_template;
  throw AppError.badRequest('Layanan ini belum memiliki template laporan. Pilih template terlebih dahulu');
}

async function getForm(idSesi, scope, idTemplateDiminta) {
  const sesi = await loadSesi(idSesi, scope);
  const template = await loadTemplate(templateIdFor(sesi, idTemplateDiminta));
  const jawaban = sesi.laporan ? await JawabanLaporan.findAll({ where: { id_laporan: sesi.laporan.id_laporan } }) : [];
  const byItem = Object.fromEntries(jawaban.map((j) => [j.id_item, j]));
  return {
    id_sesi: sesi.id_sesi,
    kode_booking: sesi.kode_booking,
    klien: { nama_lengkap: sesi.klien.nama_lengkap, nomor_rekam_psikologi: sesi.klien.nomor_rekam_psikologi },
    laporan: sesi.laporan ? { id_laporan: sesi.laporan.id_laporan, status_laporan: sesi.laporan.status_laporan, tanggal_final: sesi.laporan.tanggal_final } : null,
    template: {
      id_template: template.id_template, kode: template.kode, nama_template: template.nama_template,
      skala_min: template.skala_min, skala_max: template.skala_max, keterangan_skala: template.keterangan_skala,
    },
    items: template.items.map((it) => ({
      id_item: it.id_item, kode: it.kode, kelompok: it.kelompok, urutan: it.urutan, label: it.label, deskripsi: it.deskripsi,
      tipe: it.tipe, opsi: it.opsi ? it.opsi.split(';') : null, wajib: it.wajib,
      nilai_skala: byItem[it.id_item] ? byItem[it.id_item].nilai_skala : null,
      jawaban_teks: byItem[it.id_item] ? byItem[it.id_item].jawaban_teks : null,
    })),
  };
}

function validateJawaban(template, input) {
  const items = Object.fromEntries(template.items.map((i) => [i.id_item, i]));
  const errors = [];
  const clean = [];
  for (const j of input) {
    const item = items[j.id_item];
    if (!item) { errors.push({ field: `jawaban.${j.id_item}`, msg: 'Item tidak termasuk template ini' }); continue; }
    const row = { id_item: item.id_item, nilai_skala: null, jawaban_teks: null };
    if (item.tipe === 'skala') {
      if (j.nilai_skala !== null && j.nilai_skala !== undefined && j.nilai_skala !== '') {
        const n = Number(j.nilai_skala);
        if (!Number.isInteger(n) || n < template.skala_min || n > template.skala_max) {
          errors.push({ field: item.kode, msg: `${item.label}: nilai harus ${template.skala_min}-${template.skala_max}` });
          continue;
        }
        row.nilai_skala = n;
      }
    } else if (item.tipe === 'pilihan') {
      const opsi = (item.opsi || '').split(';');
      if (j.jawaban_teks && !opsi.includes(j.jawaban_teks)) {
        errors.push({ field: item.kode, msg: `${item.label}: pilihan tidak valid` });
        continue;
      }
      row.jawaban_teks = j.jawaban_teks || null;
    } else {
      row.jawaban_teks = j.jawaban_teks ? String(j.jawaban_teks).slice(0, 10000) : null;
    }
    clean.push(row);
  }
  if (errors.length) throw new AppError('Isian laporan tidak valid', 422, errors);
  return clean;
}

async function simpanDraft(idSesi, scope, { id_template: idTemplate, jawaban }) {
  const sesi = await loadSesi(idSesi, scope);
  if (sesi.status_asesmen === STATUS_SESI.BATAL) throw AppError.conflict('Sesi sudah dibatalkan');
  if (sesi.laporan && sesi.laporan.status_laporan === STATUS_LAPORAN.FINAL) throw AppError.conflict('Laporan sudah final dan terkunci');
  const template = await loadTemplate(templateIdFor(sesi, idTemplate));
  if (!template.is_active) throw AppError.badRequest('Template tidak aktif');
  const rows = validateJawaban(template, jawaban || []);

  await sequelize.transaction(async (t) => {
    let laporan = sesi.laporan;
    if (!laporan) laporan = await LaporanAsesmen.create({ id_sesi: sesi.id_sesi, id_template: template.id_template }, { transaction: t });
    for (const r of rows) {
      const existing = await JawabanLaporan.findOne({ where: { id_laporan: laporan.id_laporan, id_item: r.id_item }, transaction: t });
      if (existing) await existing.update(r, { transaction: t });
      else await JawabanLaporan.create({ id_laporan: laporan.id_laporan, ...r }, { transaction: t });
    }
  });
  return getForm(idSesi, scope);
}

/** Menyusun data placeholder untuk file template .docx. */
async function buildData(sesi, template, jawabanRows) {
  const klien = sesi.klien;
  const keluarga = await KeluargaKlien.findAll({ where: { id_klien: klien.id_klien }, order: [['urutan', 'ASC']] });
  const intakeAnak = await IntakeAnak.findOne({ where: { id_klien: klien.id_klien } });
  const ayah = keluarga.find((k) => k.kategori === 'Ayah') || {};
  const ibu = keluarga.find((k) => k.kategori === 'Ibu') || {};
  const sekolah = intakeAnak ? [intakeAnak.nama_sekolah, intakeAnak.kelas && `Kelas ${intakeAnak.kelas}`].filter(Boolean).join(' / ') : '';

  const data = {
    nama: klien.nama_lengkap,
    nomor_rekam_psikologi: klien.nomor_rekam_psikologi,
    jenis_kelamin: klien.jenis_kelamin || '',
    tempat_lahir: klien.tempat_lahir || '',
    tanggal_lahir: formatTanggalIndo(klien.tanggal_lahir),
    tempat_tanggal_lahir: [klien.tempat_lahir, formatTanggalIndo(klien.tanggal_lahir)].filter(Boolean).join(', '),
    usia: hitungUsia(klien.tanggal_lahir, sesi.tanggal),
    alamat: klien.alamat_rumah || '',
    pendidikan: klien.pendidikan_terakhir || sekolah,
    pekerjaan: klien.pekerjaan || '',
    sekolah,
    ayah_nama: ayah.nama || '', ayah_pendidikan: ayah.pendidikan || '', ayah_pekerjaan: ayah.pekerjaan || '',
    ibu_nama: ibu.nama || '', ibu_pendidikan: ibu.pendidikan || '', ibu_pekerjaan: ibu.pekerjaan || '',
    alamat_orang_tua: ayah.alamat || ibu.alamat || klien.alamat_rumah || '',
    no_tes: sesi.kode_booking,
    kode_booking: sesi.kode_booking,
    layanan: sesi.layanan.nama_layanan,
    tanggal_tes: formatTanggalIndo(sesi.tanggal),
    tanggal_laporan: formatTanggalIndo(toDateString()),
    kota: env.report.city,
    psikolog_nama: sesi.psikolog.nama_lengkap,
    psikolog_sipp: sesi.psikolog.sipp || '',
    psikolog_str: sesi.psikolog.str || '',
  };

  const byItem = Object.fromEntries(jawabanRows.map((j) => [j.id_item, j]));
  const kelompokMap = new Map();
  for (const it of template.items) {
    const j = byItem[it.id_item] || {};
    if (it.tipe === 'skala') {
      const row = {
        no: it.urutan, kode: it.kode, label: it.label, label_kapital: it.label.toUpperCase(),
        deskripsi: it.deskripsi || '', nilai: j.nilai_skala || '',
      };
      for (let n = 1; n <= template.skala_max; n += 1) row[`c${n}`] = j.nilai_skala === n ? '√' : '';
      data[it.kode] = j.nilai_skala || '';
      if (!kelompokMap.has(it.kelompok)) kelompokMap.set(it.kelompok, []);
      kelompokMap.get(it.kelompok).push(row);
    } else {
      data[it.kode] = j.jawaban_teks || '';
      if (it.tipe === 'pilihan') {
        for (const o of (it.opsi || '').split(';')) data[`p_${it.kode}_${slug(o)}`] = j.jawaban_teks === o ? '√' : '';
      }
    }
  }
  data.kelompok = Array.from(kelompokMap.entries()).map(([nama, items]) => ({ nama_kelompok: nama, items }));
  data.items = data.kelompok.flatMap((k) => k.items);
  for (const k of data.kelompok) data[`grup_${slug(k.nama_kelompok)}`] = k.items;
  return data;
}

function assertLengkap(template, jawabanRows) {
  const byItem = Object.fromEntries(jawabanRows.map((j) => [j.id_item, j]));
  const kosong = template.items.filter((it) => {
    if (!it.wajib) return false;
    const j = byItem[it.id_item];
    if (!j) return true;
    return it.tipe === 'skala' ? !j.nilai_skala : !j.jawaban_teks;
  });
  if (kosong.length) {
    throw new AppError('Masih ada isian wajib yang kosong', 422, kosong.map((it) => ({ field: it.kode, msg: `${it.label} wajib diisi` })));
  }
}

async function generateFiles(sesi, template, jawabanRows, prefix) {
  if (!template.file_docx) throw AppError.badRequest('Template belum memiliki file .docx. Hubungi admin');
  const data = await buildData(sesi, template, jawabanRows);
  const buffer = dokumen.render(template.file_docx, data);
  const base = `${prefix}_${sesi.kode_booking}_${Date.now()}`.replace(/[^A-Za-z0-9_-]/g, '');
  const docxPath = path.join(prefix === 'PRATINJAU' ? dokumen.DIR.tmp : dokumen.DIR.laporan, `${base}.docx`);
  fs.writeFileSync(docxPath, buffer);
  const pdfPath = await dokumen.toPdf(docxPath);
  return { docxPath, pdfPath };
}

async function pratinjau(idSesi, scope) {
  const sesi = await loadSesi(idSesi, scope);
  if (!sesi.laporan) throw AppError.badRequest('Simpan draft laporan terlebih dahulu');
  const template = await loadTemplate(sesi.laporan.id_template);
  const jawaban = await JawabanLaporan.findAll({ where: { id_laporan: sesi.laporan.id_laporan } });
  const { docxPath, pdfPath } = await generateFiles(sesi, template, jawaban, 'PRATINJAU');
  return pdfPath ? { path: pdfPath, name: `Pratinjau_${sesi.kode_booking}.pdf` } : { path: docxPath, name: `Pratinjau_${sesi.kode_booking}.docx` };
}

async function finalisasi(idSesi, scope) {
  const sesi = await loadSesi(idSesi, scope);
  if (sesi.status_asesmen !== STATUS_SESI.SELESAI) throw AppError.conflict('Laporan dapat difinalisasi setelah sesi berstatus Selesai');
  if (!sesi.laporan) throw AppError.badRequest('Laporan belum diisi');
  if (sesi.laporan.status_laporan === STATUS_LAPORAN.FINAL) throw AppError.conflict('Laporan sudah final');
  const template = await loadTemplate(sesi.laporan.id_template);
  const jawaban = await JawabanLaporan.findAll({ where: { id_laporan: sesi.laporan.id_laporan } });
  assertLengkap(template, jawaban);

  const { docxPath, pdfPath } = await generateFiles(sesi, template, jawaban, 'LAPORAN');
  await sesi.laporan.update({
    status_laporan: STATUS_LAPORAN.FINAL,
    file_docx: path.basename(docxPath),
    file_pdf: pdfPath ? path.basename(pdfPath) : null,
    tanggal_final: new Date(),
  });
  await notif.kirim({
    idUser: sesi.klien.id_user, idSesi: sesi.id_sesi, tipe: TIPE_NOTIF.LAPORAN,
    judul: `Laporan hasil pemeriksaan ${sesi.kode_booking} telah terbit`,
    pesan: `Laporan ${sesi.layanan.nama_layanan} atas nama ${sesi.klien.nama_lengkap} sudah dapat diunduh di dashboard Anda (menu Hasil Asesmen).`,
    cta: env.frontendUrl ? { label: 'Lihat Hasil Asesmen', url: `${env.frontendUrl}/klien/hasil` } : null,
  });
  await notif.kirimKeAdmin({ idSesi: sesi.id_sesi, tipe: TIPE_NOTIF.LAPORAN, judul: `Laporan ${sesi.kode_booking} final`, pesan: `${sesi.psikolog.nama_lengkap} memfinalisasi laporan ${sesi.klien.nama_lengkap}.` });
  return { status_laporan: STATUS_LAPORAN.FINAL, format: pdfPath ? 'pdf' : 'docx' };
}

/** Admin membuka kembali laporan final untuk koreksi (file lama tetap disimpan). */
async function bukaKembali(idLaporan) {
  const l = await LaporanAsesmen.findByPk(idLaporan);
  if (!l) throw AppError.notFound('Laporan tidak ditemukan');
  if (l.status_laporan !== STATUS_LAPORAN.FINAL) throw AppError.conflict('Laporan belum final');
  await l.update({ status_laporan: STATUS_LAPORAN.DRAFT, tanggal_final: null });
  return l;
}

/** Hak akses unduh (KN-03): klien pemilik (hanya Final), psikolog penangani, Admin/Super Admin. */
async function fileUntukUnduh(idLaporan, user, format) {
  const l = await LaporanAsesmen.findByPk(idLaporan, {
    include: [{ model: SesiAsesmen, as: 'sesi', attributes: ['id_sesi', 'kode_booking', 'id_psikolog'], include: [{ model: Klien, as: 'klien', attributes: ['id_user', 'nama_lengkap'] }] }],
  });
  if (!l) throw AppError.notFound('Laporan tidak ditemukan');
  const isStaff = STAFF_ROLES.includes(user.role);
  const isOwner = user.role === ROLES.KLIEN && l.sesi.klien.id_user === user.id_user;
  const isPsikolog = user.role === ROLES.PSIKOLOG && l.sesi.id_psikolog === user.id_psikolog;
  if (!isStaff && !isOwner && !isPsikolog) throw AppError.notFound('Laporan tidak ditemukan');
  if (l.status_laporan !== STATUS_LAPORAN.FINAL || (!l.file_pdf && !l.file_docx)) throw AppError.notFound('Laporan belum tersedia');

  const wantDocx = format === 'docx' && !isOwner; // klien hanya menerima PDF bila tersedia
  const file = (!wantDocx && l.file_pdf) ? l.file_pdf : l.file_docx;
  const filePath = dokumen.safeJoin(dokumen.DIR.laporan, file);
  if (!fs.existsSync(filePath)) throw AppError.notFound('File laporan tidak ditemukan di server');
  const nama = `Laporan_${l.sesi.kode_booking}_${l.sesi.klien.nama_lengkap}`.replace(/[^A-Za-z0-9_-]+/g, '_');
  return { path: filePath, name: `${nama}${path.extname(file)}` };
}

async function listUntukKlien(idUser, query) {
  const pg = getPagination(query);
  const { rows, count } = await LaporanAsesmen.findAndCountAll({
    where: { status_laporan: STATUS_LAPORAN.FINAL },
    attributes: ['id_laporan', 'tanggal_final', 'file_pdf'],
    include: [{
      model: SesiAsesmen, as: 'sesi', attributes: ['id_sesi', 'kode_booking', 'tanggal'], required: true,
      include: [
        { model: Klien, as: 'klien', attributes: ['id_klien', 'nama_lengkap'], where: { id_user: idUser } },
        { model: Layanan, as: 'layanan', attributes: ['nama_layanan'] },
        { model: Psikolog, as: 'psikolog', attributes: ['nama_lengkap'] },
        { model: Ulasan, as: 'ulasan', attributes: ['id_ulasan', 'rating'] },
      ],
    }],
    order: [['tanggal_final', 'DESC']],
    limit: pg.limit, offset: pg.offset, distinct: true,
  });
  return { rows: rows.map((r) => ({ ...r.toJSON(), format: r.file_pdf ? 'pdf' : 'docx', file_pdf: undefined })), meta: buildMeta(pg, count) };
}

async function listAdmin(query, scope = {}) {
  const pg = getPagination(query);
  const where = {};
  if (query.status) where.status_laporan = query.status;
  const { rows, count } = await LaporanAsesmen.findAndCountAll({
    where,
    attributes: ['id_laporan', 'status_laporan', 'tanggal_final', 'updated_at'],
    include: [
      { model: TemplateLaporan, as: 'template', attributes: ['kode', 'nama_template'] },
      {
        model: SesiAsesmen, as: 'sesi', attributes: ['id_sesi', 'kode_booking', 'tanggal', 'status_asesmen'], where: scope, required: true,
        include: [
          { model: Klien, as: 'klien', attributes: ['id_klien', 'nama_lengkap', 'nomor_rekam_psikologi'] },
          { model: Psikolog, as: 'psikolog', attributes: ['nama_lengkap'] },
          { model: Layanan, as: 'layanan', attributes: ['nama_layanan'] },
        ],
      },
    ],
    order: [['updated_at', 'DESC']],
    limit: pg.limit, offset: pg.offset, distinct: true,
  });
  return { rows, meta: buildMeta(pg, count) };
}

/** Membersihkan file pratinjau sementara (dipanggil job harian). */
function bersihkanTmp(maxAgeJam = 24) {
  const batas = Date.now() - maxAgeJam * 3600 * 1000;
  let n = 0;
  for (const f of fs.readdirSync(dokumen.DIR.tmp)) {
    if (f.startsWith('.')) continue;
    const p = path.join(dokumen.DIR.tmp, f);
    if (fs.statSync(p).mtimeMs < batas) { fs.unlinkSync(p); n += 1; }
  }
  return n;
}

module.exports = {
  getForm, simpanDraft, pratinjau, finalisasi, bukaKembali, fileUntukUnduh, listUntukKlien, listAdmin, buildData, bersihkanTmp,
};
