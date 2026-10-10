/** Error yang aman ditampilkan ke pengguna, lengkap dengan HTTP status. */
class AppError extends Error {
  constructor(message, statusCode = 400, errors = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
  }

  static badRequest(msg, errors) { return new AppError(msg, 400, errors); }
  static unauthorized(msg = 'Silakan login terlebih dahulu') { return new AppError(msg, 401); }
  static forbidden(msg = 'Anda tidak memiliki akses ke fitur ini') { return new AppError(msg, 403); }
  static notFound(msg = 'Data tidak ditemukan') { return new AppError(msg, 404); }
  static conflict(msg) { return new AppError(msg, 409); }
}

module.exports = AppError;
