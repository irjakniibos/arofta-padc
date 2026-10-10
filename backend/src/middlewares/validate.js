/** Menjalankan rantai express-validator lalu mengembalikan 422 jika ada input tidak valid. */
const { validationResult, matchedData } = require('express-validator');
const AppError = require('../utils/AppError');

module.exports = (rules) => [
  ...rules,
  (req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const errors = result.array({ onlyFirstError: true }).map((e) => ({ field: e.path, msg: e.msg }));
      return next(new AppError('Data yang dikirim tidak valid', 422, errors));
    }
    // Hanya field yang lolos validasi yang diteruskan ke controller
    req.validated = matchedData(req, { locations: ['body'], includeOptionals: false });
    return next();
  },
];
