/** Upload foto profil: hanya JPG/PNG, maksimal 2 MB, 1 file (di memori, isi divalidasi di service). */
const multer = require('multer');
const path = require('path');
const AppError = require('../utils/AppError');

const MAX_BYTES = 2 * 1024 * 1024;
const EXT = ['.jpg', '.jpeg', '.png'];
const MIME = ['image/jpeg', 'image/png'];

const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!EXT.includes(ext) || !MIME.includes(file.mimetype)) {
      return cb(AppError.badRequest('Format foto harus JPG atau PNG'));
    }
    return cb(null, true);
  },
}).single('foto');

module.exports = (req, res, next) => uploader(req, res, (err) => {
  if (!err) return next();
  if (err.code === 'LIMIT_FILE_SIZE') return next(new AppError('Ukuran foto maksimal 2 MB', 413));
  if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') {
    return next(AppError.badRequest('Unggah satu file pada field "foto"'));
  }
  return next(err);
});