/**
 * Pengujian end-to-end alur utama sistem:
 * register profil anak -> intake -> booking -> konfirmasi transfer -> verifikasi admin -> tautan sesi
 * -> sesi berjalan/selesai -> fee otomatis -> laporan template -> PDF -> unduh klien -> pencairan fee -> laporan keuangan.
 */
const { BASE, loginAs } = require('./helpers');
const { sequelize } = require('../src/models');
const { toDateString } = require('../src/utils/date');

let klien; let admin; let psikolog; let psikolog2; let klienLain;
const ctx = {};

beforeAll(async () => {
  [klien, admin, psikolog, psikolog2, klienLain] = await Promise.all([
    loginAs('klien1@mail.com'), loginAs('admin@arofta.id'), loginAs('psikolog1@arofta.id'), loginAs('psikolog2@arofta.id'), loginAs('klien2@mail.com'),
  ]);
});
afterAll(() => sequelize.close());

describe('Alur layanan tes psikologi anak (end-to-end)', () => {
  test('klien melihat layanan & slot jadwal tersedia (publik)', async () => {
    const layanan = await klien.get(`${BASE}/layanan?kategori=Anak dan Remaja`);
    ctx.layanan = layanan.body.data.find((l) => l.nama_layanan === 'Tes Psikologi Anak');
    expect(ctx.layanan).toBeDefined();
    const me = await psikolog.get(`${BASE}/psikolog/profil`);
    const slot = await klien.get(`${BASE}/jadwal/tersedia?id_psikolog=${me.body.data.id_psikolog}&tipe_sesi=Online`);
    expect(slot.body.data.length).toBeGreaterThan(0);
    [ctx.slot, ctx.slot2] = slot.body.data;
  });

  test('profil anak diambil dari akun klien', async () => {
    const res = await klien.get(`${BASE}/klien/profil`);
    ctx.anak = res.body.data.find((p) => p.hubungan_akun === 'Anak');
    expect(ctx.anak).toBeDefined();
  });

  test('booking ditolak bila formulir riwayat anak belum diisi', async () => {
    const res = await klien.post(`${BASE}/klien/booking`).send({ id_klien: ctx.anak.id_klien, id_layanan: ctx.layanan.id_layanan, id_jadwal: ctx.slot.id_jadwal, tipe_sesi: 'Online' });
    expect(res.status).toBe(400);
  });

  test('klien mengisi data orang tua & formulir riwayat anak', async () => {
    const base = `${BASE}/klien/profil/${ctx.anak.id_klien}`;
    expect((await klien.post(`${base}/keluarga`).send({ kategori: 'Ayah', status_hubungan: 'Kandung', nama: 'Bapak Contoh', pendidikan: 'S1', pekerjaan: 'Wiraswasta', alamat: 'Sukoharjo' })).status).toBe(201);
    expect((await klien.post(`${base}/keluarga`).send({ kategori: 'Ibu', status_hubungan: 'Kandung', nama: 'Ibu Contoh', pendidikan: 'S1', pekerjaan: 'Guru' })).status).toBe(201);
    const res = await klien.put(`${base}/intake-anak`).send({
      nama_sekolah: 'SD Negeri 1 Kartasura', kelas: '3', berat_badan_kg: 28.5, tinggi_badan_cm: 130,
      kelahiran: { keguguran_sebelumnya: 'Tidak', anak_diinginkan: 'Ya', proses_kelahiran: 'normal', berat_lahir_kg: 3.2, kualitas_makanan: 'Baik' },
      perkembangan: { duduk_bulan: '6', berjalan_bulan: '12', kata_pertama_bulan: '11' },
      pendidikan_sosial: { masuk_sd_umur: '6', pernah_tinggal_kelas: 'Tidak', hubungan_dengan_teman: 'Baik' },
    });
    expect(res.status).toBe(200);
    expect(res.body.data.kelahiran.kualitas_makanan).toBe('Baik');
    expect(res.body.data.perkembangan.berjalan_bulan).toBe('12');
  });

  test('booking berhasil membuat sesi Terdaftar dan tagihan', async () => {
    const res = await klien.post(`${BASE}/klien/booking`).send({ id_klien: ctx.anak.id_klien, id_layanan: ctx.layanan.id_layanan, id_jadwal: ctx.slot.id_jadwal, tipe_sesi: 'Online' });
    expect(res.status).toBe(201);
    ctx.sesi = res.body.data;
    expect(ctx.sesi.status_asesmen).toBe('Terdaftar');
    expect(ctx.sesi.pembayaran.status_pembayaran).toBe('Menunggu Pembayaran');
    expect(Number(ctx.sesi.pembayaran.total_bayar)).toBe(Number(ctx.layanan.harga));
    expect(ctx.sesi.info_pembayaran).toHaveProperty('link_form_bukti_bayar');
  });

  test('slot yang sama tidak bisa dipesan dua kali', async () => {
    const res = await klienLain.get(`${BASE}/klien/profil`);
    const res2 = await klienLain.post(`${BASE}/klien/booking`).send({ id_klien: res.body.data[0].id_klien, id_layanan: 5, id_jadwal: ctx.slot.id_jadwal, tipe_sesi: 'Online' });
    expect([400, 409]).toContain(res2.status);
  });

  test('klien lain tidak dapat melihat sesi milik orang lain', async () => {
    expect((await klienLain.get(`${BASE}/klien/sesi/${ctx.sesi.id_sesi}`)).status).toBe(404);
  });

  test('tautan sesi belum bisa dikirim sebelum lunas', async () => {
    const res = await admin.patch(`${BASE}/admin/sesi/${ctx.sesi.id_sesi}/tautan`).send({ tautan_zoom: 'https://zoom.us/j/123456789' });
    expect(res.status).toBe(409);
  });

  test('klien konfirmasi sudah transfer, admin memverifikasi Lunas', async () => {
    const k = await klien.patch(`${BASE}/klien/sesi/${ctx.sesi.id_sesi}/konfirmasi-pembayaran`);
    expect(k.body.data.pembayaran.status_pembayaran).toBe('Menunggu Verifikasi');
    const list = await admin.get(`${BASE}/admin/pembayaran?status=Menunggu Verifikasi`);
    const bayar = list.body.data.find((p) => p.id_sesi === ctx.sesi.id_sesi);
    expect(bayar).toBeDefined();
    const ditolakTanpaAlasan = await admin.patch(`${BASE}/admin/pembayaran/${bayar.id_pembayaran}/verifikasi`).send({ status: 'Ditolak' });
    expect(ditolakTanpaAlasan.status).toBe(400);
    const v = await admin.patch(`${BASE}/admin/pembayaran/${bayar.id_pembayaran}/verifikasi`).send({ status: 'Lunas' });
    expect(v.status).toBe(200);
    expect(v.body.data.status_pembayaran).toBe('Lunas');
  });

  test('admin menginput tautan Zoom, klien & psikolog mendapat notifikasi', async () => {
    const res = await admin.patch(`${BASE}/admin/sesi/${ctx.sesi.id_sesi}/tautan`).send({ tautan_zoom: 'https://zoom.us/j/123456789' });
    expect(res.status).toBe(200);
    const detail = await klien.get(`${BASE}/klien/sesi/${ctx.sesi.id_sesi}`);
    expect(detail.body.data.tautan_zoom).toBe('https://zoom.us/j/123456789');
    const n = await klien.get(`${BASE}/notifikasi`);
    expect(n.body.data.some((x) => x.tipe === 'Tautan Sesi')).toBe(true);
    const np = await psikolog.get(`${BASE}/notifikasi?belum_dibaca=true`);
    expect(np.body.meta.belum_dibaca).toBeGreaterThan(0);
  });

  test('admin memantau status asesmen (monitoring)', async () => {
    const res = await admin.get(`${BASE}/admin/monitoring?status=Terdaftar`);
    expect(res.body.meta.ringkasan_status.Terdaftar).toBeGreaterThan(0);
  });

  test('psikolog lain tidak dapat mengakses sesi ini', async () => {
    expect((await psikolog2.get(`${BASE}/psikolog/sesi/${ctx.sesi.id_sesi}`)).status).toBe(404);
  });

  test('psikolog memulai & menyelesaikan sesi, fee tercatat otomatis', async () => {
    // simulasikan waktu sesi telah tiba
    await sequelize.query('UPDATE sesi_asesmen SET tanggal = ?, waktu = ? WHERE id_sesi = ?', { replacements: [toDateString(), new Date().toTimeString().slice(0, 8), ctx.sesi.id_sesi] });
    const detail = await psikolog.get(`${BASE}/psikolog/sesi/${ctx.sesi.id_sesi}`);
    expect(detail.body.data.klien.intakeAnak.nama_sekolah).toBe('SD Negeri 1 Kartasura');
    expect((await psikolog.patch(`${BASE}/psikolog/sesi/${ctx.sesi.id_sesi}/status`).send({ status: 'Selesai' })).status).toBe(409);
    expect((await psikolog.patch(`${BASE}/psikolog/sesi/${ctx.sesi.id_sesi}/status`).send({ status: 'Berjalan' })).status).toBe(200);
    const soap = await psikolog.put(`${BASE}/psikolog/sesi/${ctx.sesi.id_sesi}/soap`).send({ subjective: 'Orang tua mengeluhkan konsentrasi anak', intervensi: ['Psikoedukasi', 'Relaksasi'], masalah_utama: 'Konsentrasi' });
    expect(soap.body.data.intervensi).toBe('Psikoedukasi;Relaksasi');
    expect((await psikolog.put(`${BASE}/psikolog/sesi/${ctx.sesi.id_sesi}/observasi`).send({ mood: 'Eutimia', afek: 'Luas' })).status).toBe(200);
    const done = await psikolog.patch(`${BASE}/psikolog/sesi/${ctx.sesi.id_sesi}/status`).send({ status: 'Selesai' });
    expect(done.status).toBe(200);
    expect(done.body.data.total_fee).toBe(200000);
  });

  test('psikolog mengisi laporan template, validasi isian wajib', async () => {
    const form = await psikolog.get(`${BASE}/psikolog/sesi/${ctx.sesi.id_sesi}/laporan`);
    expect(form.body.data.template.kode).toBe('TES_ANAK');
    ctx.items = form.body.data.items;
    const salah = await psikolog.put(`${BASE}/psikolog/sesi/${ctx.sesi.id_sesi}/laporan`).send({ jawaban: [{ id_item: ctx.items[0].id_item, nilai_skala: 9 }] });
    expect(salah.status).toBe(422);
    const sebagian = await psikolog.put(`${BASE}/psikolog/sesi/${ctx.sesi.id_sesi}/laporan`).send({ jawaban: [{ id_item: ctx.items[0].id_item, nilai_skala: 4 }] });
    expect(sebagian.status).toBe(200);
    const belumLengkap = await psikolog.post(`${BASE}/psikolog/sesi/${ctx.sesi.id_sesi}/laporan/finalisasi`);
    expect(belumLengkap.status).toBe(422);
  });

  test('laporan difinalisasi menjadi PDF dan klien dapat mengunduh', async () => {
    const jawaban = ctx.items.map((it, i) => (it.tipe === 'skala'
      ? { id_item: it.id_item, nilai_skala: (i % 6) + 1 }
      : { id_item: it.id_item, jawaban_teks: { iq: '108', skala_iq: 'WISC', kategori_iq: 'Rata-rata' }[it.kode] || `Isian ${it.label}.\nBaris kedua.` }));
    expect((await psikolog.put(`${BASE}/psikolog/sesi/${ctx.sesi.id_sesi}/laporan`).send({ jawaban })).status).toBe(200);
    const fin = await psikolog.post(`${BASE}/psikolog/sesi/${ctx.sesi.id_sesi}/laporan/finalisasi`);
    expect(fin.status).toBe(200);
    // PDF bila LibreOffice tersedia (SOFFICE_PATH), selain itu sistem tetap menghasilkan .docx (fallback)
    ctx.format = fin.body.data.format;
    expect(['pdf', 'docx']).toContain(ctx.format);

    const list = await klien.get(`${BASE}/klien/laporan`);
    ctx.laporan = list.body.data.find((l) => l.sesi.id_sesi === ctx.sesi.id_sesi);
    const file = await klien.get(`${BASE}/laporan/${ctx.laporan.id_laporan}/unduh`).buffer(true).parse((res, cb) => { const d = []; res.on('data', (c) => d.push(c)); res.on('end', () => cb(null, Buffer.concat(d))); });
    expect(file.status).toBe(200);
    if (ctx.format === 'pdf') {
      expect(file.headers['content-type']).toMatch(/pdf/);
      expect(file.body.slice(0, 4).toString()).toBe('%PDF');
    } else {
      expect(file.body.slice(0, 2).toString()).toBe('PK'); // file .docx (zip)
    }
    require('fs').writeFileSync(require('path').resolve(__dirname, `../storage/tmp/hasil_uji_laporan.${ctx.format}`), file.body);
  });

  test('laporan tidak dapat diunduh oleh klien lain & laporan final terkunci', async () => {
    expect((await klienLain.get(`${BASE}/laporan/${ctx.laporan.id_laporan}/unduh`)).status).toBe(404);
    expect((await psikolog.put(`${BASE}/psikolog/sesi/${ctx.sesi.id_sesi}/laporan`).send({ jawaban: [] })).status).toBe(409);
  });

  test('admin melihat Fee Psikolog dan mencairkannya', async () => {
    const rekap = await admin.get(`${BASE}/admin/fee`);
    const me = await psikolog.get(`${BASE}/psikolog/profil`);
    const row = rekap.body.data.psikolog.find((p) => p.id_psikolog === me.body.data.id_psikolog);
    expect(Number(row.belum_dibayar)).toBe(200000);
    const detail = await admin.get(`${BASE}/admin/fee/psikolog/${me.body.data.id_psikolog}?status=Belum Dibayar`);
    const ids = detail.body.data.rows.map((r) => r.id_fee);
    const bayar = await admin.patch(`${BASE}/admin/fee/bayar`).send({ id_fee: ids, catatan: 'Transfer BSI' });
    expect(bayar.body.data.total).toBe(200000);
    const feeSaya = await psikolog.get(`${BASE}/psikolog/fee`);
    expect(Number(feeSaya.body.data.ringkasan.belum_dibayar)).toBe(0);
  });

  test('laporan keuangan bulanan menghitung pemasukan, pengeluaran, dan surplus', async () => {
    await admin.post(`${BASE}/admin/pengeluaran`).send({ tanggal: toDateString(), kategori: 'Listrik', nominal: 30000 });
    const res = await admin.get(`${BASE}/admin/laporan-keuangan`);
    expect(res.body.data.pemasukan).toBeGreaterThanOrEqual(350000);
    expect(res.body.data.pengeluaran.fee_psikolog).toBeGreaterThanOrEqual(200000);
    expect(res.body.data.surplus).toBe(res.body.data.pemasukan - res.body.data.pengeluaran.total);
  });

  test('dashboard tiap role dapat diakses', async () => {
    expect((await admin.get(`${BASE}/admin/dashboard`)).body.data).toHaveProperty('sesi_per_status');
    expect((await psikolog.get(`${BASE}/psikolog/dashboard`)).body.data).toHaveProperty('fee_bulan_ini');
    expect((await klien.get(`${BASE}/klien/dashboard`)).body.data.laporan_tersedia).toBeGreaterThan(0);
  });

  test('klien memberi ulasan setelah sesi selesai (nama disamarkan di publik)', async () => {
    const res = await klien.post(`${BASE}/klien/sesi/${ctx.sesi.id_sesi}/ulasan`).send({ rating: 5, komentar: 'Psikolognya sabar dan penjelasannya jelas.' });
    expect(res.status).toBe(201);
    expect((await klien.post(`${BASE}/klien/sesi/${ctx.sesi.id_sesi}/ulasan`).send({ rating: 4 })).status).toBe(409);
    expect((await klien.post(`${BASE}/klien/sesi/${ctx.sesi.id_sesi}/ulasan`).send({ rating: 9 })).status).toBe(422);
    const me = await psikolog.get(`${BASE}/psikolog/profil`);
    ctx.idPsikolog = me.body.data.id_psikolog;
    const pub = await klienLain.get(`${BASE}/psikolog/${ctx.idPsikolog}/ulasan`);
    expect(pub.body.data.ringkasan).toEqual({ rata_rata: 5, jumlah: 1 });
    expect(pub.body.data.ulasan[0].nama_klien).toBe('A***k'); // "Anak Contoh" disamarkan
    const list = await klienLain.get(`${BASE}/psikolog`);
    expect(list.body.data.find((p) => p.id_psikolog === ctx.idPsikolog).rating.jumlah).toBe(1);
    ctx.idUlasan = res.body.data.id_ulasan;
  });

  test('admin dapat menyembunyikan ulasan', async () => {
    const res = await admin.patch(`${BASE}/admin/ulasan/${ctx.idUlasan}/tampil`).send({ is_tampil: false });
    expect(res.status).toBe(200);
    const pub = await klienLain.get(`${BASE}/psikolog/${ctx.idPsikolog}/ulasan`);
    expect(pub.body.data.ringkasan.jumlah).toBe(0);
    expect((await admin.get(`${BASE}/admin/ulasan?is_tampil=false`)).body.data.length).toBe(1);
  });

  test('kalender jadwal: klien melihat tanggal tersedia, admin & psikolog melihat sesi sebulan', async () => {
    const now = new Date();
    const q = `bulan=${now.getMonth() + 1}&tahun=${now.getFullYear()}`;
    const pub = await klien.get(`${BASE}/jadwal/kalender?${q}`);
    expect(pub.status).toBe(200);
    expect(Array.isArray(pub.body.data.tanggal)).toBe(true);
    if (pub.body.data.tanggal.length) expect(pub.body.data.tanggal[0]).toHaveProperty('slot_tersedia');
    const adm = await admin.get(`${BASE}/admin/kalender?${q}`);
    expect(adm.body.data.sesi.some((x) => x.id_sesi === ctx.sesi.id_sesi)).toBe(true);
    const psi = await psikolog.get(`${BASE}/psikolog/kalender?${q}`);
    expect(psi.body.data.sesi.every((x) => x.psikolog.id_psikolog === ctx.idPsikolog)).toBe(true);
    expect((await psikolog2.get(`${BASE}/psikolog/kalender?${q}`)).body.data.sesi.some((x) => x.id_sesi === ctx.sesi.id_sesi)).toBe(false);
  });

  test('klien dapat membatalkan booking yang belum dibayar & slot terbuka kembali', async () => {
    const b = await klien.post(`${BASE}/klien/booking`).send({ id_klien: ctx.anak.id_klien, id_layanan: ctx.layanan.id_layanan, id_jadwal: ctx.slot2.id_jadwal, tipe_sesi: 'Online' });
    expect(b.status).toBe(201);
    const batal = await klien.patch(`${BASE}/klien/sesi/${b.body.data.id_sesi}/batal`).send({ alasan: 'Berhalangan' });
    expect(batal.body.data.status_asesmen).toBe('Batal');
    const [[slot]] = await sequelize.query('SELECT status_slot FROM jadwal_psikolog WHERE id_jadwal = ?', { replacements: [ctx.slot2.id_jadwal] });
    expect(slot.status_slot).toBe('Tersedia');
  });
});
