const path = require('path');
const fs = require('fs');
const { BASE, loginAs, superadmin } = require('./helpers');
const { sequelize } = require('../src/models');

let admin;
beforeAll(async () => { admin = await loginAs('admin@arofta.id'); });
afterAll(() => sequelize.close());

describe('CRUD data master oleh Admin', () => {
  let idLayanan;

  test('tambah layanan', async () => {
    const res = await admin.post(`${BASE}/admin/layanan`).send({ nama_layanan: 'Layanan Uji', kategori: 'Industri', harga: 150000, durasi_menit: 60, jenis_intake: 'Dewasa' });
    expect(res.status).toBe(201);
    idLayanan = res.body.data.id_layanan;
  });

  test('tambah layanan ditolak bila harga negatif', async () => {
    const res = await admin.post(`${BASE}/admin/layanan`).send({ nama_layanan: 'X', kategori: 'Industri', harga: -5 });
    expect(res.status).toBe(422);
  });

  test('lihat & ubah layanan', async () => {
    const res = await admin.put(`${BASE}/admin/layanan/${idLayanan}`).send({ harga: 175000, deskripsi: 'Diperbarui' });
    expect(res.status).toBe(200);
    expect(Number(res.body.data.harga)).toBe(175000);
    const list = await admin.get(`${BASE}/admin/layanan?q=Uji`);
    expect(list.body.data.some((l) => l.id_layanan === idLayanan)).toBe(true);
  });

  test('atur tarif fee psikolog per layanan', async () => {
    const res = await admin.put(`${BASE}/admin/layanan/${idLayanan}/fee`).send({ items: [{ id_kategori_fee: 10, nominal: 120000 }] });
    expect(res.status).toBe(200);
    expect(res.body.data.tarifFee).toHaveLength(1);
  });

  test('hapus layanan yang belum dipakai', async () => {
    const res = await admin.delete(`${BASE}/admin/layanan/${idLayanan}`);
    expect(res.status).toBe(200);
    expect(res.body.data.dihapus).toBe(true);
  });

  test('CRUD pengeluaran', async () => {
    const c = await admin.post(`${BASE}/admin/pengeluaran`).send({ tanggal: new Date().toISOString().slice(0, 10), kategori: 'Alat Tes', nominal: 50000, keterangan: 'Lembar jawaban' });
    expect(c.status).toBe(201);
    const id = c.body.data.id_pengeluaran;
    expect((await admin.put(`${BASE}/admin/pengeluaran/${id}`).send({ nominal: 60000 })).status).toBe(200);
    expect((await admin.delete(`${BASE}/admin/pengeluaran/${id}`)).status).toBe(200);
    expect((await admin.delete(`${BASE}/admin/pengeluaran/${id}`)).status).toBe(404);
  });

  test('ubah pengaturan rekening & link Google Form', async () => {
    const res = await admin.put(`${BASE}/admin/pengaturan`).send({ items: [
      { kunci: 'bank_nama', nilai: 'BSI' }, { kunci: 'bank_no_rekening', nilai: '1234567890' },
      { kunci: 'bank_atas_nama', nilai: 'AROFTA PADC' }, { kunci: 'link_form_bukti_bayar', nilai: 'https://forms.gle/contoh' },
    ] });
    expect(res.status).toBe(200);
    expect((await admin.put(`${BASE}/admin/pengaturan`).send({ items: [{ kunci: 'tidak_ada', nilai: 'x' }] })).status).toBe(400);
  });

  test('buat akun psikolog baru', async () => {
    const res = await admin.post(`${BASE}/admin/psikolog`).send({ email: 'psikolog.baru@arofta.id', password: 'Psikolog123', nama_lengkap: 'Psikolog Baru, M.Psi.', sipp: 'SIPP-UJI-9' });
    expect(res.status).toBe(201);
  });
});

describe('Upload template laporan', () => {
  test('menolak file selain .docx', async () => {
    const res = await admin.post(`${BASE}/admin/template-laporan/1/file`).attach('file', Buffer.from('bukan docx'), { filename: 'jahat.exe', contentType: 'application/octet-stream' });
    expect(res.status).toBe(400);
  });

  test('menerima .docx valid dan menaikkan versi', async () => {
    const file = path.resolve(__dirname, '../templates/TES_ANAK.docx');
    const res = await admin.post(`${BASE}/admin/template-laporan/1/file`).attach('file', fs.readFileSync(file), { filename: 'TES_ANAK_baru.docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    expect(res.status).toBe(200);
    expect(res.body.data.template.versi).toBe(2);
    expect(res.body.data.placeholder_terdeteksi).toEqual(expect.arrayContaining(['nama', '#kelompok']));
  });

  test('panduan placeholder tersedia', async () => {
    const res = await admin.get(`${BASE}/admin/template-laporan/1/panduan`);
    expect(res.status).toBe(200);
    expect(res.body.data.identitas.length).toBeGreaterThan(10);
  });
});

describe('Super Admin', () => {
  test('membuat akun Admin & melihat audit log', async () => {
    const sa = await loginAs(superadmin.email, superadmin.password);
    const res = await sa.post(`${BASE}/superadmin/users`).send({ email: 'admin2@arofta.id', password: 'AdminDua123', role: 'Admin' });
    expect(res.status).toBe(201);
    const log = await sa.get(`${BASE}/superadmin/audit-log?limit=5`);
    expect(log.status).toBe(200);
    expect(log.body.data.length).toBeGreaterThan(0);
    // Super Admin mewarisi akses Admin
    expect((await sa.get(`${BASE}/admin/dashboard`)).status).toBe(200);
  });
});
