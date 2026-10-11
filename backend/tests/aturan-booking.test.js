/**
 * Pengujian aturan booking & pembayaran serta proses otomatis (job):
 * batas waktu booking, batas bayar, maksimal booking belum dibayar, kedaluwarsa tagihan,
 * penolakan & konfirmasi ulang, peringatan verifikasi, pengingat jadwal (KF-08/09/17),
 * alokasi ulang sesi (KF-03), booking oleh Admin (walk-in), perubahan nominal, dan persetujuan privasi.
 */
const { request, app, BASE, loginAs } = require('./helpers');
const { sequelize } = require('../src/models');
const { toDateString } = require('../src/utils/date');
const booking = require('../src/services/booking.service');
const pembayaran = require('../src/services/pembayaran.service');
const reminder = require('../src/jobs/reminder.job');

let admin; let klien2; let psikolog2; let klienBaru;
const ctx = {};
const JAM = 3600000;

const hariIni = (plusHari = 0) => toDateString(new Date(Date.now() + plusHari * 86400000));
const jam = (d) => d.toTimeString().slice(0, 5);
/** Rentang waktu hari ini mulai `menit` dari sekarang; null bila melewati tengah malam (uji dilewati). */
function rentangHariIni(menitMulai, durasiMenit) {
  const mulai = new Date(Date.now() + menitMulai * 60000);
  const selesai = new Date(mulai.getTime() + durasiMenit * 60000);
  if (toDateString(mulai) !== toDateString() || toDateString(selesai) !== toDateString()) return null;
  return { tanggal: toDateString(), jam_mulai: jam(mulai), jam_selesai: jam(selesai) };
}

async function buatSlot(idPsikolog, tanggal, jamMulai, jamSelesai) {
  const res = await admin.post(`${BASE}/admin/psikolog/${idPsikolog}/jadwal`).send({ tanggal, jam_mulai: jamMulai, jam_selesai: jamSelesai, tipe_sesi: 'Keduanya' });
  expect(res.status).toBe(201);
  return res.body.data.id_jadwal;
}

const pesan = (agent, idJadwal, extra = {}) => agent.post(`${BASE}/klien/booking`).send({
  id_klien: ctx.idKlienBaru, id_layanan: ctx.idLayanan, id_jadwal: idJadwal, tipe_sesi: 'Online', setuju_persetujuan: true, ...extra,
});

async function notifTerbaru(agent, judulMengandung) {
  const res = await agent.get(`${BASE}/notifikasi?limit=50`);
  return res.body.data.find((n) => n.judul.includes(judulMengandung));
}

const statusSesi = async (id) => (await sequelize.query('SELECT status_asesmen FROM sesi_asesmen WHERE id_sesi = ?', { replacements: [id] }))[0][0].status_asesmen;
const statusSlot = async (id) => (await sequelize.query('SELECT status_slot FROM jadwal_psikolog WHERE id_jadwal = ?', { replacements: [id] }))[0][0].status_slot;

beforeAll(async () => {
  [admin, klien2, psikolog2] = await Promise.all([loginAs('admin@arofta.id'), loginAs('klien2@mail.com'), loginAs('psikolog2@arofta.id')]);
  ctx.idPsikolog1 = (await (await loginAs('psikolog1@arofta.id')).get(`${BASE}/psikolog/profil`)).body.data.id_psikolog;
  ctx.idPsikolog2 = (await psikolog2.get(`${BASE}/psikolog/profil`)).body.data.id_psikolog;

  // Layanan tanpa formulir intake agar uji fokus pada aturan booking
  const l = await admin.post(`${BASE}/admin/layanan`).send({ nama_layanan: 'Layanan Uji Aturan Booking', kategori: 'Masyarakat Umum', harga: 100000, durasi_menit: 60, jenis_intake: 'Tidak Ada' });
  ctx.idLayanan = l.body.data.id_layanan;
  await admin.put(`${BASE}/admin/layanan/${ctx.idLayanan}/fee`).send({ items: [{ id_kategori_fee: 10, nominal: 60000 }] });

  const reg = await request(app).post(`${BASE}/auth/register`).send({
    nama_lengkap: 'Klien Uji Aturan', email: 'uji.aturan@mail.com', password: 'Rahasia123', konfirmasi_password: 'Rahasia123', setuju_privasi: true,
  });
  expect(reg.status).toBe(201);
  ctx.idKlienBaru = reg.body.data.id_klien;
  klienBaru = await loginAs('uji.aturan@mail.com', 'Rahasia123');

  ctx.slot = [];
  for (let i = 0; i < 4; i += 1) ctx.slot.push(await buatSlot(ctx.idPsikolog2, hariIni(20 + i), '10:00', '11:00'));
});
afterAll(() => sequelize.close());

describe('Batas waktu booking dan batas bayar', () => {
  test('batas bayar: 24 jam setelah booking atau 1 jam sebelum sesi, mana yang lebih dulu', () => {
    const aturan = { batasBayarJam: 24, sebelumSesiJam: 1 };
    const now = new Date('2026-10-12T09:00:00');
    expect(booking.hitungBatasBayar(new Date('2026-10-19T09:00:00'), aturan, now)).toEqual(new Date('2026-10-13T09:00:00'));
    expect(booking.hitungBatasBayar(new Date('2026-10-13T08:00:00'), aturan, now)).toEqual(new Date('2026-10-13T07:00:00'));
    expect(booking.hitungBatasBayar(new Date('2026-10-12T12:00:00'), aturan, now)).toEqual(new Date('2026-10-12T11:00:00'));
    // tidak pernah langsung kedaluwarsa: minimal 30 menit dari sekarang (atau sampai sesi mulai)
    expect(booking.hitungBatasBayar(new Date('2026-10-12T09:45:00'), aturan, now)).toEqual(new Date('2026-10-12T09:30:00'));
  });

  test('slot yang dimulai kurang dari 3 jam lagi tidak tampil untuk klien dan booking online ditolak', async () => {
    const r = rentangHariIni(60, 30);
    if (!r) return;
    ctx.slotDekat = await buatSlot(ctx.idPsikolog2, r.tanggal, r.jam_mulai, r.jam_selesai);
    const tersedia = await klienBaru.get(`${BASE}/jadwal/tersedia?id_psikolog=${ctx.idPsikolog2}&tanggal=${r.tanggal}`);
    expect(tersedia.body.data.some((s) => s.id_jadwal === ctx.slotDekat)).toBe(false);
    // Admin tetap melihat slot tersebut untuk jadwal ulang
    const staf = await admin.get(`${BASE}/admin/jadwal/tersedia?tanggal=${r.tanggal}`);
    expect(staf.body.data.some((s) => s.id_jadwal === ctx.slotDekat)).toBe(true);
    expect((await klienBaru.get(`${BASE}/admin/jadwal/tersedia?tanggal=${r.tanggal}`)).status).toBe(403);
    const res = await pesan(klienBaru, ctx.slotDekat);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/paling lambat 3 jam/);
  });

  test('booking tanpa centang informed consent ditolak', async () => {
    const res = await pesan(klienBaru, ctx.slot[0], { setuju_persetujuan: false });
    expect(res.status).toBe(422);
  });
});

describe('Maksimal booking belum dibayar per akun', () => {
  test('booking ke-3 ditolak saat batas 2, dan bisa lagi setelah satu dibatalkan', async () => {
    expect((await admin.put(`${BASE}/admin/pengaturan`).send({ items: [{ kunci: 'maks_booking_belum_bayar', nilai: '2' }] })).status).toBe(200);
    const a = await pesan(klienBaru, ctx.slot[0]);
    const b = await pesan(klienBaru, ctx.slot[1]);
    expect([a.status, b.status]).toEqual([201, 201]);
    ctx.sesiA = a.body.data; ctx.sesiB = b.body.data;
    const c = await pesan(klienBaru, ctx.slot[2]);
    expect(c.status).toBe(409);
    expect(c.body.message).toMatch(/belum dibayar/);

    await klienBaru.patch(`${BASE}/klien/sesi/${ctx.sesiB.id_sesi}/batal`).send({ alasan: 'Uji batas' });
    const d = await pesan(klienBaru, ctx.slot[2]);
    expect(d.status).toBe(201);
    ctx.sesiC = d.body.data;
    await admin.put(`${BASE}/admin/pengaturan`).send({ items: [{ kunci: 'maks_booking_belum_bayar', nilai: '5' }] });
  });
});

describe('Notifikasi admin atas aksi klien', () => {
  test('admin diberi tahu saat klien baru mendaftar dan saat klien membatalkan booking', async () => {
    expect(await notifTerbaru(admin, 'Klien baru mendaftar: Klien Uji Aturan')).toBeDefined();
    expect(await notifTerbaru(admin, `Booking ${ctx.sesiB.kode_booking} dibatalkan klien`)).toBeDefined();
  });
});

describe('Proses otomatis pembayaran', () => {
  test('tagihan lewat batas bayar dibatalkan otomatis dan slot terbuka kembali', async () => {
    await sequelize.query('UPDATE pembayaran SET batas_bayar = ? WHERE id_sesi = ?', { replacements: [new Date(Date.now() - 60000), ctx.sesiA.id_sesi] });
    expect(await pembayaran.batalkanKedaluwarsa()).toBeGreaterThanOrEqual(1);
    expect(await statusSesi(ctx.sesiA.id_sesi)).toBe('Batal');
    expect(await statusSlot(ctx.slot[0])).toBe('Tersedia');
    expect(await notifTerbaru(klienBaru, `Booking ${ctx.sesiA.kode_booking} dibatalkan`)).toBeDefined();
  });

  test('konfirmasi via WhatsApp memberi tahu admin; penolakan memberi batas bayar baru', async () => {
    const k = await klienBaru.patch(`${BASE}/klien/sesi/${ctx.sesiC.id_sesi}/konfirmasi-pembayaran`);
    expect(k.body.data.pembayaran.status_pembayaran).toBe('Menunggu Verifikasi');
    const n = await notifTerbaru(admin, `Konfirmasi transfer ${ctx.sesiC.kode_booking}`);
    expect(n.pesan).toMatch(/WhatsApp/);

    await sequelize.query('UPDATE pembayaran SET batas_bayar = ? WHERE id_sesi = ?', { replacements: [new Date(Date.now() - JAM), ctx.sesiC.id_sesi] });
    const tolak = await admin.patch(`${BASE}/admin/pembayaran/${ctx.sesiC.pembayaran.id_pembayaran}/verifikasi`).send({ status: 'Ditolak', catatan_admin: 'Nominal transfer kurang' });
    expect(tolak.status).toBe(200);
    expect(new Date(tolak.body.data.batas_bayar).getTime()).toBeGreaterThan(Date.now());
    expect((await notifTerbaru(klienBaru, 'belum dapat diverifikasi')).pesan).toMatch(/Nominal transfer kurang/);
    // tagihan Ditolak tidak ikut dibatalkan selama batas bayar barunya belum lewat
    await pembayaran.batalkanKedaluwarsa();
    expect(await statusSesi(ctx.sesiC.id_sesi)).toBe('Terdaftar');
    const ulang = await klienBaru.patch(`${BASE}/klien/sesi/${ctx.sesiC.id_sesi}/konfirmasi-pembayaran`);
    expect(ulang.body.data.pembayaran.status_pembayaran).toBe('Menunggu Verifikasi');
  });

  test('admin diperingatkan sekali bila sesi segera dimulai tetapi pembayaran belum diverifikasi', async () => {
    const r = rentangHariIni(30, 60);
    if (!r) return;
    await sequelize.query('UPDATE sesi_asesmen SET tanggal = ?, waktu = ? WHERE id_sesi = ?', { replacements: [r.tanggal, `${r.jam_mulai}:00`, ctx.sesiC.id_sesi] });
    expect(await pembayaran.peringatkanBelumVerifikasi()).toBeGreaterThanOrEqual(1);
    expect(await notifTerbaru(admin, `Segera verifikasi pembayaran ${ctx.sesiC.kode_booking}`)).toBeDefined();
    const [[p]] = await sequelize.query('SELECT peringatan_terkirim FROM pembayaran WHERE id_sesi = ?', { replacements: [ctx.sesiC.id_sesi] });
    expect(Boolean(p.peringatan_terkirim)).toBe(true);
    ctx.sesiDekat = true;
  });

  test('pengingat jadwal otomatis berisi tautan sesi dikirim ke klien dan psikolog (KF-08, KF-09, KF-17)', async () => {
    if (!ctx.sesiDekat) return;
    await admin.patch(`${BASE}/admin/pembayaran/${ctx.sesiC.pembayaran.id_pembayaran}/verifikasi`).send({ status: 'Lunas' });
    await admin.patch(`${BASE}/admin/sesi/${ctx.sesiC.id_sesi}/tautan`).send({ tautan_zoom: 'https://zoom.us/j/uji-pengingat' });
    expect(await reminder.run()).toBeGreaterThanOrEqual(1);
    const [[s]] = await sequelize.query('SELECT reminder_terkirim FROM sesi_asesmen WHERE id_sesi = ?', { replacements: [ctx.sesiC.id_sesi] });
    expect(Boolean(s.reminder_terkirim)).toBe(true);
    expect((await notifTerbaru(klienBaru, `Pengingat sesi ${ctx.sesiC.kode_booking}`)).pesan).toMatch(/zoom\.us\/j\/uji-pengingat/);
    expect(await notifTerbaru(psikolog2, `Pengingat sesi ${ctx.sesiC.kode_booking}`)).toBeDefined();
    expect(await reminder.run()).toBe(0); // tidak dikirim dua kali
  });
});

describe('Alokasi ulang dan perubahan nominal oleh Admin', () => {
  test('admin menjadwalkan ulang sesi ke psikolog lain (KF-03)', async () => {
    const b = await pesan(klienBaru, ctx.slot[3]);
    expect(b.status).toBe(201);
    ctx.sesiD = b.body.data;
    const tujuan = await buatSlot(ctx.idPsikolog1, hariIni(26), '13:00', '14:00');
    const res = await admin.patch(`${BASE}/admin/sesi/${ctx.sesiD.id_sesi}/alokasi`).send({ id_jadwal: tujuan });
    expect(res.status).toBe(200);
    expect(res.body.data.psikolog.id_psikolog).toBe(ctx.idPsikolog1);
    expect(await statusSlot(ctx.slot[3])).toBe('Tersedia');
    expect(await statusSlot(tujuan)).toBe('Dipesan');
    expect(await notifTerbaru(klienBaru, `Perubahan jadwal sesi ${ctx.sesiD.kode_booking}`)).toBeDefined();
  });

  test('admin mengubah nominal tagihan dengan alasan, klien mendapat notifikasi', async () => {
    const url = `${BASE}/admin/pembayaran/${ctx.sesiD.pembayaran.id_pembayaran}/nominal`;
    expect((await admin.patch(url).send({ total_bayar: 80000 })).status).toBe(422);
    const res = await admin.patch(url).send({ total_bayar: 80000, alasan_ubah_nominal: 'Diskon mahasiswa' });
    expect(res.status).toBe(200);
    expect(Number(res.body.data.total_bayar)).toBe(80000);
    expect(Number(res.body.data.harga_layanan)).toBe(100000);
    expect((await notifTerbaru(klienBaru, `Nominal tagihan ${ctx.sesiD.kode_booking}`)).pesan).toMatch(/Diskon mahasiswa/);
    await admin.patch(`${BASE}/admin/pembayaran/${ctx.sesiD.pembayaran.id_pembayaran}/verifikasi`).send({ status: 'Lunas' });
    expect((await admin.patch(url).send({ total_bayar: 50000, alasan_ubah_nominal: 'x' })).status).toBe(409);
  });
});

describe('Booking oleh Admin untuk kebutuhan mendesak', () => {
  const dasar = () => ({ id_layanan: ctx.idLayanan, tipe_sesi: 'Offline', metode_bayar: 'Tunai', setuju_persetujuan: true });

  test('hanya Admin yang dapat membuat booking atas nama klien', async () => {
    expect((await klien2.post(`${BASE}/admin/booking`).send(dasar())).status).toBe(403);
    expect((await psikolog2.post(`${BASE}/admin/booking`).send(dasar())).status).toBe(403);
  });

  test('validasi: klien wajib dipilih, consent wajib, nominal diubah wajib beralasan', async () => {
    expect((await admin.post(`${BASE}/admin/booking`).send({ ...dasar(), klien_mode: 'terdaftar', id_jadwal: ctx.slot[0] })).status).toBe(422);
    expect((await admin.post(`${BASE}/admin/booking`).send({ ...dasar(), klien_mode: 'tanpa_akun', nama_lengkap: 'Walk In', id_jadwal: ctx.slot[0], setuju_persetujuan: false })).status).toBe(422);
    const res = await admin.post(`${BASE}/admin/booking`).send({ ...dasar(), klien_mode: 'tanpa_akun', nama_lengkap: 'Walk In', id_jadwal: ctx.slot[0], total_bayar: 50000 });
    expect(res.status).toBe(400);
    expect(await statusSlot(ctx.slot[0])).toBe('Tersedia');
  });

  test('walk-in tanpa akun dengan slot baru saat itu juga: langsung Lunas, fee psikolog tetap sesuai tarif', async () => {
    const r = rentangHariIni(-10, 60);
    if (!r) return;
    const res = await admin.post(`${BASE}/admin/booking`).send({
      ...dasar(), klien_mode: 'tanpa_akun', nama_lengkap: 'Ibu Walk In', no_hp: '081299990000',
      id_psikolog: ctx.idPsikolog2, ...r, total_bayar: 70000, alasan_ubah_nominal: 'Diskon sosial',
    });
    expect(res.status).toBe(201);
    const s = res.body.data;
    expect(s.status_asesmen).toBe('Terdaftar');
    expect(s.pembayaran).toMatchObject({ status_pembayaran: 'Lunas', metode_bayar: 'Tunai', alasan_ubah_nominal: 'Diskon sosial' });
    expect(Number(s.pembayaran.total_bayar)).toBe(70000);
    expect(s.klien.akun).toBeNull();
    expect(await notifTerbaru(psikolog2, `Jadwal sesi baru ${s.kode_booking}`)).toBeDefined();

    expect((await psikolog2.patch(`${BASE}/psikolog/sesi/${s.id_sesi}/status`).send({ status: 'Berjalan' })).status).toBe(200);
    const selesai = await psikolog2.patch(`${BASE}/psikolog/sesi/${s.id_sesi}/status`).send({ status: 'Selesai' });
    expect(selesai.status).toBe(200);
    expect(selesai.body.data.total_fee).toBe(60000);
    const [[a]] = await sequelize.query('SELECT aksi FROM audit_log WHERE id_entitas = ? AND aksi = ?', { replacements: [String(s.id_sesi), 'BOOKING_ADMIN'] });
    expect(a).toBeDefined();
    ctx.idKlienWalkIn = s.klien.id_klien;
  });

  test('admin melengkapi profil dan formulir klien walk-in; klien lain tidak bisa', async () => {
    if (!ctx.idKlienWalkIn) return;
    const base = `${BASE}/admin/klien/${ctx.idKlienWalkIn}`;
    // kolom wajib yang kosong ditolak beserta daftar kolomnya
    const kurang = await admin.put(base).send({ pekerjaan: 'Guru' });
    expect(kurang.status).toBe(422);
    expect(kurang.body.errors.map((e) => e.field)).toEqual(expect.arrayContaining(['jenis_kelamin', 'tempat_lahir', 'agama']));
    expect((await admin.put(base).send({
      jenis_kelamin: 'Perempuan', tempat_lahir: 'Sukoharjo', tanggal_lahir: '1990-01-01', alamat_rumah: 'Kartasura',
      agama: 'Islam', pendidikan_terakhir: 'S1', pekerjaan: 'Guru', status_pernikahan: 'Menikah',
    })).status).toBe(200);
    expect((await admin.put(`${base}/intake-dewasa`).send({ pernyataan_benar: true })).status).toBe(422);
    expect((await admin.put(`${base}/intake-dewasa`).send({
      kegemaran_hobi: 'Membaca', kelebihan: 'Teliti', kekurangan: 'Mudah cemas', keluhan_saat_ini: 'Sulit tidur',
      harapan_pemeriksaan: 'Lebih tenang', pernyataan_benar: false,
    })).status).toBe(422);
    expect((await admin.put(`${base}/intake-dewasa`).send({
      kegemaran_hobi: 'Membaca', kelebihan: 'Teliti', kekurangan: 'Mudah cemas', keluhan_saat_ini: 'Sulit tidur',
      harapan_pemeriksaan: 'Lebih tenang', pernyataan_benar: true,
    })).status).toBe(200);
    expect((await admin.post(`${base}/keluarga`).send({ kategori: 'Pasangan', nama: 'Bapak Contoh' })).status).toBe(201);
    const detail = await admin.get(base);
    expect(detail.body.data.pekerjaan).toBe('Guru');
    expect(detail.body.data.intakeDewasa.pernyataan_benar).toBe(true);
    expect((await klien2.put(base).send({ pekerjaan: 'X' })).status).toBe(403);
    expect((await klien2.put(`${BASE}/klien/profil/${ctx.idKlienWalkIn}`).send({ pekerjaan: 'X' })).status).toBe(404);
  });

  test('walk-in dengan akun baru: klien dibuatkan akun dan menerima tautan atur password', async () => {
    const idJadwal = ctx.slotDekat || ctx.slot[0];
    const res = await admin.post(`${BASE}/admin/booking`).send({
      ...dasar(), metode_bayar: 'Transfer Bank', klien_mode: 'buat_akun', nama_lengkap: 'Bapak Walk In', email: 'walkin.baru@mail.com', id_jadwal: idJadwal,
    });
    expect(res.status).toBe(201);
    expect(res.body.data.klien.akun.email).toBe('walkin.baru@mail.com');
    const [[t]] = await sequelize.query(
      'SELECT pr.expires_at FROM password_reset pr JOIN users u ON u.id_user = pr.id_user WHERE u.email = ? AND pr.used_at IS NULL',
      { replacements: ['walkin.baru@mail.com'] },
    );
    expect(new Date(t.expires_at).getTime()).toBeGreaterThan(Date.now() + 70 * JAM);
    const dobel = await admin.post(`${BASE}/admin/booking`).send({ ...dasar(), klien_mode: 'buat_akun', nama_lengkap: 'Bapak Walk In', email: 'walkin.baru@mail.com', id_jadwal: ctx.slot[0] });
    expect(dobel.status).toBe(409);
  });

  test('booking untuk klien terdaftar mengirim notifikasi ke akun klien', async () => {
    const profil = await klien2.get(`${BASE}/klien/profil`);
    const idJadwal = await buatSlot(ctx.idPsikolog2, hariIni(27), '10:00', '11:00');
    const res = await admin.post(`${BASE}/admin/booking`).send({ ...dasar(), klien_mode: 'terdaftar', id_klien: profil.body.data[0].id_klien, id_jadwal: idJadwal });
    expect(res.status).toBe(201);
    expect(await notifTerbaru(klien2, `Sesi ${res.body.data.kode_booking} telah dijadwalkan`)).toBeDefined();
  });
});

describe('Persetujuan Kebijakan Privasi', () => {
  test('akun lama diminta menyetujui Kebijakan Privasi, lalu tersimpan', async () => {
    const before = await klien2.get(`${BASE}/auth/me`);
    expect(before.body.data.perlu_persetujuan_privasi).toBe(true);
    const res = await klien2.post(`${BASE}/auth/persetujuan-privasi`);
    expect(res.status).toBe(200);
    expect(res.body.data.perlu_persetujuan_privasi).toBe(false);
  });
});
