/** Mengambil hanya field yang diizinkan dari objek input (mencegah mass assignment). */
module.exports = function pick(source = {}, allowed = []) {
  const out = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(source, key) && source[key] !== undefined) {
      out[key] = source[key] === '' ? null : source[key];
    }
  }
  return out;
};
