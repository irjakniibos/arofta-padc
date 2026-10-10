/**
 * Pengiriman email via SMTP (nodemailer).
 * Jika SMTP_HOST kosong (development), email hanya dicatat di log.
 */
const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');

let transporter = null;
if (env.mail.host) {
  transporter = nodemailer.createTransport({
    host: env.mail.host,
    port: env.mail.port,
    secure: env.mail.secure,
    auth: env.mail.user ? { user: env.mail.user, pass: env.mail.password } : undefined,
  });
}

const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function layout(judul, pesan, cta) {
  const paragraphs = String(pesan).split('\n').map((p) => `<p style="margin:0 0 12px">${escapeHtml(p)}</p>`).join('');
  const button = cta ? `<p style="margin:20px 0"><a href="${escapeHtml(cta.url)}" style="background:#1d4ed8;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">${escapeHtml(cta.label)}</a></p>` : '';
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1f2937">
  <h2 style="color:#1d4ed8;margin-bottom:16px">${escapeHtml(judul)}</h2>${paragraphs}${button}
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
  <p style="font-size:12px;color:#6b7280">Email otomatis dari Sistem Layanan Psikologi AROFTA PADC. Mohon tidak membalas email ini.</p></div>`;
}

async function send({ to, subject, text, cta }) {
  if (!to) return false;
  if (!transporter) {
    // Mode development (SMTP kosong): isi email ditampilkan di terminal agar bisa diuji tanpa server email
    logger.info(`[EMAIL-DEV] Ke: ${to} | Subjek: ${subject}${cta ? `\n  Tautan: ${cta.url}` : ''}`);
    return false;
  }
  try {
    await transporter.sendMail({ from: env.mail.from, to, subject, text, html: layout(subject, text, cta) });
    return true;
  } catch (e) {
    logger.error('Gagal mengirim email:', e.message);
    return false;
  }
}

module.exports = { send };
