const request = require('supertest');
const app = require('../src/app');
const env = require('../src/config/env');

const BASE = env.apiBasePath;
const PASSWORD = 'Password123';

/** Login dan kembalikan agent supertest yang menyimpan cookie sesi. */
async function loginAs(email, password = PASSWORD) {
  const agent = request.agent(app);
  const res = await agent.post(`${BASE}/auth/login`).send({ email, password });
  if (res.status !== 200) throw new Error(`Login ${email} gagal: ${res.status} ${JSON.stringify(res.body)}`);
  return agent;
}

module.exports = { request, app, BASE, PASSWORD, loginAs, superadmin: { email: process.env.SEED_SUPERADMIN_EMAIL, password: process.env.SEED_SUPERADMIN_PASSWORD } };
