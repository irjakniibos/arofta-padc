/**
 * Pengujian login dengan Google (KF-28) tanpa menghubungi server Google:
 * klaim id_token disimulasikan, alur redirect & state diuji lewat endpoint.
 */
const { request, app, BASE, loginAs } = require('./helpers');
const { sequelize } = require('../src/models');
const env = require('../src/config/env');
const google = require('../src/services/google.service');

afterAll(() => sequelize.close());

const klaim = (extra = {}) => ({ sub: `g-${Math.random().toString(36).slice(2)}`, email_verified: true, name: 'Pengguna Google', ...extra });
const tokenPalsu = (payload) => `x.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.y`;

describe('Login dengan Google', () => {
  test('id_token divalidasi: aud, issuer, dan masa berlaku', () => {
    const dasar = { iss: 'https://accounts.google.com', aud: env.google.clientId || 'client-uji', exp: Math.floor(Date.now() / 1000) + 300, sub: '1', email: 'a@mail.com' };
    const simpan = env.google.clientId;
    env.google.clientId = dasar.aud;
    expect(google.bacaIdToken(tokenPalsu(dasar)).email).toBe('a@mail.com');
    expect(() => google.bacaIdToken(tokenPalsu({ ...dasar, aud: 'aplikasi-lain' }))).toThrow(/tidak ditujukan/);
    expect(() => google.bacaIdToken(tokenPalsu({ ...dasar, iss: 'https://evil.com' }))).toThrow(/tidak ditujukan/);
    expect(() => google.bacaIdToken(tokenPalsu({ ...dasar, exp: 1 }))).toThrow(/kedaluwarsa/);
    env.google.clientId = simpan;
  });

  test('email baru: akun klien dibuat tanpa password dan diminta menyetujui privasi', async () => {
    const r = await google.masuk(klaim({ email: 'baru.google@gmail.com' }));
    expect(r.baru).toBe(true);
    expect(r.user.role).toBe('Klien');
    expect(r.user.punya_password).toBe(false);
    expect(r.user.google_terhubung).toBe(true);
    expect(r.user.perlu_persetujuan_privasi).toBe(true);
    expect(r.user.profil_klien[0].nama_lengkap).toBe('Pengguna Google');
  });

  test('akun yang sudah ada (psikolog) tertaut otomatis dan role tetap dari database', async () => {
    const c = klaim({ email: 'psikolog1@arofta.id' });
    const r = await google.masuk(c);
    expect(r.baru).toBe(false);
    expect(r.user.role).toBe('Psikolog');
    expect((await google.masuk(c)).user.id_user).toBe(r.user.id_user);
    // akun Google lain dengan email yang sama ditolak
    await expect(google.masuk(klaim({ email: 'psikolog1@arofta.id' }))).rejects.toThrow(/akun Google lain/);
    // password lama tetap bisa dipakai
    await loginAs('psikolog1@arofta.id');
  });

  test('email belum terverifikasi dan akun nonaktif ditolak', async () => {
    await expect(google.masuk(klaim({ email: 'belum.verif@gmail.com', email_verified: false }))).rejects.toThrow(/terverifikasi/);
    await sequelize.query("UPDATE users SET is_active = 0 WHERE email = 'baru.google@gmail.com'");
    await expect(google.masuk(klaim({ email: 'baru.google@gmail.com' }))).rejects.toThrow(/dinonaktifkan/);
    await sequelize.query("UPDATE users SET is_active = 1 WHERE email = 'baru.google@gmail.com'");
  });

  test('akun Google tanpa password tidak bisa login password dan diarahkan ke lupa password saat ubah password', async () => {
    const res = await request(app).post(`${BASE}/auth/login`).send({ email: 'baru.google@gmail.com', password: 'Apapun123' });
    expect(res.status).toBe(401);
    const r = await google.masuk(klaim({ email: 'kedua.google@gmail.com' }));
    const agent = request.agent(app);
    agent.jar.setCookie(`${env.auth.cookieName}=${r.token}`);
    const ubah = await agent.put(`${BASE}/auth/password`).send({ password_lama: 'x', password_baru: 'BaruSekali123', konfirmasi_password: 'BaruSekali123' });
    expect(ubah.status).toBe(400);
    expect(ubah.body.message).toMatch(/Lupa password/);
  });

  test('callback menolak state yang tidak cocok dan pembatalan dari Google', async () => {
    const tanpaState = await request(app).get(`${BASE}/auth/google/callback?code=abc&state=xyz`);
    expect(tanpaState.status).toBe(200);
    expect(tanpaState.text).toMatch(/masuk\?google=sesi/);
    const batal = await request(app).get(`${BASE}/auth/google/callback?error=access_denied`);
    expect(batal.text).toMatch(/masuk\?google=batal/);
    expect((await request(app).get(`${BASE}/auth/google/status`)).body.data).toHaveProperty('aktif');
  });

  test('admin membuat akun psikolog tanpa password (masuk dengan Google)', async () => {
    const admin = await loginAs('admin@arofta.id');
    const res = await admin.post(`${BASE}/admin/psikolog`).send({ email: 'psikolog.google@gmail.com', nama_lengkap: 'Psikolog Google, M.Psi.' });
    expect(res.status).toBe(201);
    const r = await google.masuk(klaim({ email: 'psikolog.google@gmail.com' }));
    expect(r.user.role).toBe('Psikolog');
    expect(r.baru).toBe(false);
  });
});
