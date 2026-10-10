/**
 * Upload file template laporan (SOP poin 1):
 * - ekstensi & MIME dibatasi eksplisit (.docx)
 * - ukuran maksimum dari .env, maksimal 1 file per request
 * - disimpan di folder privat storage/tmp (tidak bisa diakses lewat URL)
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const env = require('../config/env');
const { UPLOAD } = require('../config/constants');
const AppError = require('../utils/AppError');

const tmpDir = path.join(env.storage.root, 'tmp');
fs.mkdirSync(tmpDir, { recursive: true });

const storage = multer.diskStorage({
  destination: tmpDir,
  filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.docx`),
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!UPLOAD.TEMPLATE_EXT.includes(ext) || !UPLOAD.TEMPLATE_MIME.includes(file.mimetype)) {
    return cb(AppError.badRequest(`Format file tidak diizinkan. Hanya ${UPLOAD.TEMPLATE_EXT.join(', ')}`));
  }
  return cb(null, true);
}

const uploadTemplate = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.storage.uploadMaxSizeMb * 1024 * 1024, files: UPLOAD.MAX_FILES, fields: 5 },
}).single('file');

module.exports = { uploadTemplate };
