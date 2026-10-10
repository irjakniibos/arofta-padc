const { request, app, BASE, loginAs } = require('./helpers');
const { sequelize } = require('../src/models');

afterAll(() => sequelize.close());

describe('Autentikasi & keamanan', () => {
  const user = { nama_lengkap: 'Uji Register', email: 'uji.register@mail.com', password: 'Rahasia123', konfirmasi_password: 'Rahasia123', no_hp: '081234567890', setuju_privasi: true };

  test('register menolak input tidak valid (validasi backend)', async () => {
    const res = await request(app).post(`${BASE}/auth/register`).send({ email: 'bukan-email', password: '123' });
    expect(res.status).toBe(422);
    expect(res.body.errors.map((e) => e.field)).toEqual(expect.arrayContaining(['nama_lengkap', 'email', 'password']));
  });

  test('register ditolak bila Kebijakan Privasi tidak disetujui', async () => {
    const res = await request(app).post(`${BASE}/auth/register`).send({ ...user, setuju_privasi: false });
    expect(res.status).toBe(422);
    expect(res.body.errors.map((e) => e.field)).toContain('setuju_privasi');
  });

  test('register berhasil & password tersimpan sebagai hash', async () => {
    const res = await request(app).post(`${BASE}/auth/register`).send(user);
    expect(res.status).toBe(201);
    const [[row]] = await sequelize.query('SELECT password FROM users WHERE email = ?', { replacements: [user.email] });
    expect(row.password).not.toBe(user.password);
    expect(row.password.startsWith('$2')).toBe(true);
    const [[p]] = await sequelize.query('SELECT privasi_disetujui_at, privasi_versi FROM users WHERE email = ?', { replacements: [user.email] });
    expect(p.privasi_disetujui_at).not.toBeNull();
    expect(p.privasi_versi).toBe('1.0');
  });

  test('register email duplikat ditolak', async () => {
    const res = await request(app).post(`${BASE}/auth/register`).send(user);
    expect(res.status).toBe(409);
  });

  test('tag HTML/script pada input dibersihkan (masking input)', async () => {
    const res = await request(app).post(`${BASE}/auth/register`).send({ ...user, email: 'xss@mail.com', nama_lengkap: '<b>Nama</b> Bersih' });
    expect(res.status).toBe(201);
    const [[row]] = await sequelize.query('SELECT nama_lengkap FROM klien WHERE id_klien = ?', { replacements: [res.body.data.id_klien] });
    expect(row.nama_lengkap).toBe('Nama Bersih');
  });

  test('upaya SQL injection pada login tidak lolos', async () => {
    const res = await request(app).post(`${BASE}/auth/login`).send({ email: "' OR 1=1 --@x.com", password: "' OR '1'='1" });
    expect([401, 422]).toContain(res.status);
  });

  test('login berhasil memberi cookie httpOnly dan /me mengembalikan profil tanpa password', async () => {
    const res = await request(app).post(`${BASE}/auth/login`).send({ email: user.email, password: user.password });
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'][0]).toMatch(/HttpOnly/);
    expect(res.body.data.password).toBeUndefined();
    const agent = await loginAs(user.email, user.password);
    const me = await agent.get(`${BASE}/auth/me`);
    expect(me.body.data.role).toBe('Klien');
    expect(me.body.data.profil_klien).toHaveLength(1);
  });

  test('akun terkunci setelah 5x password salah (mitigasi brute force)', async () => {
    for (let i = 0; i < 5; i += 1) {
      const r = await request(app).post(`${BASE}/auth/login`).send({ email: user.email, password: 'SalahTerus1' });
      expect(r.status).toBe(401);
    }
    const locked = await request(app).post(`${BASE}/auth/login`).send({ email: user.email, password: user.password });
    expect(locked.status).toBe(423);
    await sequelize.query('UPDATE users SET locked_until = NULL WHERE email = ?', { replacements: [user.email] });
  });

  test('ganti password & logout', async () => {
    const agent = await loginAs(user.email, user.password);
    const res = await agent.put(`${BASE}/auth/password`).send({ password_lama: user.password, password_baru: 'BaruLagi123', konfirmasi_password: 'BaruLagi123' });
    expect(res.status).toBe(200);
    await agent.post(`${BASE}/auth/logout`);
    expect((await agent.get(`${BASE}/auth/me`)).status).toBe(401);
    await loginAs(user.email, 'BaruLagi123');
  });

  test('validasi akses berbasis role (RBAC)', async () => {
    expect((await request(app).get(`${BASE}/admin/dashboard`)).status).toBe(401);
    const klien = await loginAs('klien1@mail.com');
    expect((await klien.get(`${BASE}/admin/dashboard`)).status).toBe(403);
    expect((await klien.get(`${BASE}/psikolog/dashboard`)).status).toBe(403);
    expect((await klien.get(`${BASE}/superadmin/users`)).status).toBe(403);
    const admin = await loginAs('admin@arofta.id');
    expect((await admin.get(`${BASE}/admin/dashboard`)).status).toBe(200);
    expect((await admin.get(`${BASE}/superadmin/users`)).status).toBe(403);
  });

  test('payload lebih dari 10 KB ditolak', async () => {
    const res = await request(app).post(`${BASE}/auth/login`).send({ email: 'a@b.com', password: 'x'.repeat(11000) });
    expect(res.status).toBe(413);
  });

  test('pagination dibatasi maksimal 50 data per halaman', async () => {
    const admin = await loginAs('admin@arofta.id');
    expect((await admin.get(`${BASE}/admin/klien?limit=500`)).status).toBe(422);
    const ok = await admin.get(`${BASE}/admin/klien?limit=2&page=1`);
    expect(ok.body.data.length).toBeLessThanOrEqual(2);
    expect(ok.body.meta).toMatchObject({ page: 1, limit: 2 });
  });
});
