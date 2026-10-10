/**
 * Pengisian template .docx (docxtemplater) dan konversi ke PDF (LibreOffice headless).
 * Jika LibreOffice tidak tersedia, laporan tetap tersedia dalam format .docx (fallback).
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const { pathToFileURL } = require('url');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const DIR = {
  template: path.join(env.storage.root, 'template'),
  laporan: path.join(env.storage.root, 'laporan'),
  tmp: path.join(env.storage.root, 'tmp'),
};
Object.values(DIR).forEach((d) => fs.mkdirSync(d, { recursive: true }));

/** Memastikan path tetap di dalam folder yang diizinkan (mencegah path traversal). */
function safeJoin(base, fileName) {
  const resolved = path.resolve(base, path.basename(String(fileName)));
  if (!resolved.startsWith(path.resolve(base) + path.sep)) throw AppError.badRequest('Nama file tidak valid');
  return resolved;
}

function compile(buffer) {
  let zip;
  try {
    zip = new PizZip(buffer);
  } catch (e) {
    throw AppError.badRequest('File bukan dokumen Word (.docx) yang valid');
  }
  try {
    return new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => '',
    });
  } catch (e) {
    const details = (e.properties && e.properties.errors ? e.properties.errors : [e])
      .slice(0, 10)
      .map((err) => ({ field: (err.properties && err.properties.xtag) || 'template', msg: (err.properties && err.properties.explanation) || err.message }));
    throw new AppError('Format placeholder pada template tidak valid', 422, details);
  }
}

/** Validasi file template hasil upload: harus .docx valid dengan sintaks placeholder benar. */
function validateTemplate(filePath) {
  const doc = compile(fs.readFileSync(filePath));
  const text = doc.getFullText();
  const tags = Array.from(new Set((text.match(/\{[^{}]+\}/g) || []).map((t) => t.slice(1, -1))));
  return { tags };
}

function render(templateFile, data) {
  const doc = compile(fs.readFileSync(safeJoin(DIR.template, templateFile)));
  try {
    doc.render(data);
  } catch (e) {
    throw new AppError('Gagal mengisi template laporan, periksa placeholder pada file template', 422);
  }
  return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

let antrean = Promise.resolve();

/**
 * Konversi DOCX -> PDF. Dijalankan satu per satu (antrean) agar tidak membebani server (KN-07).
 * Mengembalikan path PDF, atau null jika LibreOffice tidak tersedia/gagal.
 */
function toPdf(docxPath) {
  if (!env.report.sofficePath) return Promise.resolve(null);
  const job = antrean.then(() => new Promise((resolve) => {
    const outDir = path.dirname(docxPath);
    // Profil LibreOffice terpisah agar tidak bentrok dengan LibreOffice yang sedang dibuka pengguna.
    // pathToFileURL menghasilkan URL yang benar di Windows (file:///C:/...) maupun Linux (file:///tmp/...)
    const profile = pathToFileURL(path.join(os.tmpdir(), 'arofta-lo-profile')).href;
    execFile(env.report.sofficePath, [`-env:UserInstallation=${profile}`, '--headless', '--convert-to', 'pdf', '--outdir', outDir, docxPath],
      { timeout: 120000 }, (err) => {
        const pdfPath = docxPath.replace(/\.docx$/i, '.pdf');
        if (err || !fs.existsSync(pdfPath)) {
          logger.warn('Konversi PDF gagal, laporan tetap tersedia dalam .docx:', err ? err.message : 'file tidak ditemukan');
          return resolve(null);
        }
        return resolve(pdfPath);
      });
  }));
  antrean = job.catch(() => null);
  return job;
}

module.exports = { DIR, safeJoin, validateTemplate, render, toPdf };
