const { PAGINATION } = require('../config/constants');

/** Membaca ?page=&limit= dan membatasi jumlah data per halaman (SOP poin 5). */
function getPagination(query = {}) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || PAGINATION.DEFAULT_LIMIT, 1), PAGINATION.MAX_LIMIT);
  return { page, limit, offset: (page - 1) * limit };
}

function buildMeta({ page, limit }, total) {
  return { page, limit, total, total_pages: Math.ceil(total / limit) || 0 };
}

module.exports = { getPagination, buildMeta };
