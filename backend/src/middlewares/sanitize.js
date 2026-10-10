/**
 * Masking input global (SOP poin 1): menghapus tag HTML/script dan karakter < >
 * dari semua string di body, query, dan params untuk mencegah XSS/injection.
 */
const TAG = /<[^>]*>?/g;
const ANGLE = /[<>]/g;
// eslint-disable-next-line no-control-regex
const CTRL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function clean(value) {
  if (typeof value === 'string') return value.replace(TAG, '').replace(ANGLE, '').replace(CTRL, '').trim();
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith('$') || k.includes('.')) continue; // tolak key operator
      out[k] = clean(v);
    }
    return out;
  }
  return value;
}

module.exports = (req, res, next) => {
  if (req.body) req.body = clean(req.body);
  if (req.query) req.query = clean(req.query);
  if (req.params) req.params = clean(req.params);
  next();
};

module.exports.clean = clean;
