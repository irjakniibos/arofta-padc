/** Aturan validasi yang dipakai berulang (DRY). */
const { body, param, query } = require('express-validator');
const fieldDefs = require('../models/fields');

const NAMA_REGEX = /^[A-Za-zÀ-ɏ .,'’-]+$/;
const HP_REGEX = /^(\+62|62|0)8[0-9]{7,12}$/;
/** 'nama_lengkap' -> 'Nama lengkap' untuk pesan error yang ramah pengguna */
const label = (f) => { const t = String(f).replace(/\[\d+\]|\.\*|\./g, ' ').replace(/_/g, ' ').trim(); return t.charAt(0).toUpperCase() + t.slice(1); };

const PASSWORD_MSG = 'Password minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka';

const idParam = (name = 'id') => param(name).isInt({ min: 1 }).withMessage('ID tidak valid').toInt();

const email = (field = 'email') => body(field).trim().notEmpty().withMessage('Email wajib diisi')
  .isEmail().withMessage('Format email tidak valid').isLength({ max: 255 }).normalizeEmail({ gmail_remove_dots: false });

const password = (field = 'password') => body(field).isString().withMessage(PASSWORD_MSG)
  .isLength({ min: 8, max: 72 }).withMessage(PASSWORD_MSG)
  .matches(/[a-z]/).withMessage(PASSWORD_MSG)
  .matches(/[A-Z]/).withMessage(PASSWORD_MSG)
  .matches(/[0-9]/).withMessage(PASSWORD_MSG);

const nama = (field, { optional = false, max = 150 } = {}) => {
  let chain = body(field);
  chain = optional ? chain.optional({ values: 'falsy' }) : chain.notEmpty().withMessage(`${label(field)} wajib diisi`);
  return chain.isString().isLength({ max }).withMessage(`${label(field)} maksimal ${max} karakter`)
    .matches(NAMA_REGEX).withMessage(`${label(field)} hanya boleh berisi huruf dan tanda baca nama`);
};

const noHp = (field = 'no_hp', optional = true) => {
  let chain = body(field);
  if (optional) chain = chain.optional({ values: 'falsy' });
  return chain.customSanitizer((v) => String(v).replace(/[\s-]/g, ''))
    .matches(HP_REGEX).withMessage('Nomor HP tidak valid (contoh: 081234567890)');
};

const text = (field, max = 5000) => body(field).optional({ values: 'null' }).isString().withMessage(`${label(field)} harus teks`)
  .isLength({ max }).withMessage(`${label(field)} maksimal ${max} karakter`);

const str = (field, max = 255) => text(field, max);

const date = (field, { optional = true } = {}) => {
  let chain = body(field);
  chain = optional ? chain.optional({ values: 'null' }) : chain.notEmpty().withMessage(`${label(field)} wajib diisi`);
  return chain.isISO8601({ strict: true }).withMessage(`${label(field)} harus format YYYY-MM-DD`).isLength({ max: 10 });
};

const time = (field) => body(field).notEmpty().withMessage(`${label(field)} wajib diisi`)
  .matches(/^([01]\d|2[0-3]):[0-5]\d(:00)?$/).withMessage(`${label(field)} harus format HH:mm`);

const oneOf = (field, values, { optional = true } = {}) => {
  let chain = body(field);
  chain = optional ? chain.optional({ values: 'null' }) : chain.notEmpty().withMessage(`${label(field)} wajib diisi`);
  return chain.isIn(values).withMessage(`${label(field)} harus salah satu dari: ${values.join(', ')}`);
};

const money = (field, { optional = false } = {}) => {
  let chain = body(field);
  chain = optional ? chain.optional() : chain.exists().withMessage(`${label(field)} wajib diisi`);
  return chain.isFloat({ min: 0, max: 9999999999 }).withMessage(`${label(field)} harus angka >= 0`).toFloat();
};

const bool = (field) => body(field).optional().isBoolean().withMessage(`${label(field)} harus true/false`).toBoolean();

const pagination = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
];

/** Validator otomatis untuk formulir klinis berdasarkan models/fields.js */
function fromFieldDefs(defs) {
  return Object.entries(defs).map(([name, [type, arg]]) => {
    if (type === 'text') return text(name, 5000);
    if (type === 'string') return str(name, arg);
    if (type === 'enum') return oneOf(name, arg);
    if (type === 'bool') return bool(name);
    if (type === 'decimal') return body(name).optional({ values: 'null' }).isFloat({ min: 0, max: arg }).withMessage(`${label(name)} harus angka 0-${arg}`).toFloat();
    return body(name).optional();
  });
}

module.exports = {
  idParam, email, password, nama, noHp, text, str, date, time, oneOf, money, bool, pagination,
  fromFieldDefs, fieldDefs, PASSWORD_MSG, label,
};
