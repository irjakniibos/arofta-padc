/** Logger sederhana dengan timestamp; nonaktif saat testing. */
const env = require('../config/env');

function write(level, args) {
  if (env.isTest && level !== 'error') return;
  // eslint-disable-next-line no-console
  console[level === 'error' ? 'error' : 'log'](`[${new Date().toISOString()}] [${level.toUpperCase()}]`, ...args);
}

module.exports = {
  info: (...a) => write('info', a),
  warn: (...a) => write('warn', a),
  error: (...a) => write('error', a),
};
