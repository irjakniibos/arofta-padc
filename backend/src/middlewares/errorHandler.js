/** Penanganan error terpusat: pesan aman untuk pengguna, detail hanya di log server. */
const multer = require('multer');
const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

function notFound(req, res, next) {
  next(AppError.notFound(`Endpoint ${req.method} ${req.originalUrl} tidak ditemukan`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let error = err;

  if (err instanceof UniqueConstraintError) {
    error = AppError.conflict('Data sudah terdaftar (duplikat)');
  } else if (err instanceof ForeignKeyConstraintError) {
    error = AppError.conflict('Data masih digunakan atau relasi tidak valid');
  } else if (err instanceof ValidationError) {
    error = new AppError('Data tidak valid', 422, err.errors.map((e) => ({ field: e.path, msg: e.message })));
  } else if (err instanceof multer.MulterError) {
    const map = { LIMIT_FILE_SIZE: 'Ukuran file melebihi batas', LIMIT_FILE_COUNT: 'Jumlah file melebihi batas', LIMIT_UNEXPECTED_FILE: 'Field file tidak sesuai' };
    error = AppError.badRequest(map[err.code] || 'Upload file gagal');
  } else if (err.type === 'entity.too.large') {
    error = new AppError('Ukuran data yang dikirim terlalu besar', 413);
  } else if (err.type === 'entity.parse.failed') {
    error = AppError.badRequest('Format JSON tidak valid');
  }

  if (!error.isOperational) {
    logger.error(err.stack || err);
    error = new AppError('Terjadi kesalahan pada server', 500);
  }

  const body = { success: false, message: error.message };
  if (error.errors) body.errors = error.errors;
  res.status(error.statusCode || 500).json(body);
}

module.exports = { notFound, errorHandler };
