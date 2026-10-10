/** Format response JSON yang seragam untuk seluruh endpoint. */
function ok(res, data = null, message = 'Berhasil', meta = undefined) {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(200).json(body);
}

function created(res, data = null, message = 'Data berhasil dibuat') {
  return res.status(201).json({ success: true, message, data });
}

module.exports = { ok, created };
