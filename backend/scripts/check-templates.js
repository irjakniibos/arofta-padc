/* eslint-disable no-console */
/**
 * Mengisi setiap template laporan aktif dengan data contoh lalu membuat PDF di storage/tmp.
 * Dipakai untuk memeriksa template setelah diunggah/diubah: npm run template:check
 */
const path = require('path');
const fs = require('fs');
const { sequelize, TemplateLaporan, TemplateItem } = require('../src/models');
const laporan = require('../src/services/laporan.service');
const dokumen = require('../src/services/dokumen.service');

const contohSesi = {
  kode_booking: 'ARF-CONTOH-0001',
  tanggal: new Date().toISOString().slice(0, 10),
  layanan: { nama_layanan: 'Contoh Layanan' },
  klien: {
    id_klien: 0, nama_lengkap: 'Nama Klien Contoh', nomor_rekam_psikologi: 'RP-CONTOH', jenis_kelamin: 'Laki-laki', tempat_lahir: 'Sukoharjo',
    tanggal_lahir: '2000-01-15', alamat_rumah: 'Jl. Contoh No. 1, Kartasura', pendidikan_terakhir: 'S1 Psikologi', pekerjaan: 'Karyawan',
  },
  psikolog: { nama_lengkap: 'Nama Psikolog, M.Psi., Psikolog', sipp: '0000-00-0-0/HIMPSI', str: 'STR-CONTOH' },
};

(async () => {
  const templates = await TemplateLaporan.findAll({
    where: { is_active: true },
    include: [{ model: TemplateItem, as: 'items', where: { is_active: true }, required: false }],
    order: [['id_template', 'ASC'], [{ model: TemplateItem, as: 'items' }, 'urutan', 'ASC']],
  });
  for (const t of templates) {
    if (!t.file_docx) { console.log(`- ${t.kode}: belum ada file .docx`); continue; }
    const jawaban = t.items.map((it, i) => ({
      id_item: it.id_item,
      nilai_skala: it.tipe === 'skala' ? (i % (t.skala_max - t.skala_min + 1)) + t.skala_min : null,
      jawaban_teks: it.tipe === 'pilihan' ? it.opsi.split(';')[0] : (it.tipe === 'teks' ? `Contoh isian ${it.label}` : null),
    }));
    try {
      const data = await laporan.buildData(contohSesi, t, jawaban);
      const out = path.join(dokumen.DIR.tmp, `CEK_${t.kode}.docx`);
      fs.writeFileSync(out, dokumen.render(t.file_docx, data));
      const pdf = await dokumen.toPdf(out);
      console.log(`✓ ${t.kode}: ${pdf || out}`);
    } catch (e) {
      console.log(`✗ ${t.kode}: ${e.message}`, e.errors || '');
    }
  }
  await sequelize.close();
})();
