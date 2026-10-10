/** Catatan klinis internal per sesi: anamnesis, observasi status mental, dan SOAP. */
const { AnamnesisSesi, ObservasiMental, CatatanSoap } = require('../models');
const F = require('../models/fields');
const { STATUS_SESI } = require('../config/constants');
const AppError = require('../utils/AppError');
const pick = require('../utils/pick');
const sesiService = require('./sesi.service');

const BAGIAN = {
  anamnesis: { model: AnamnesisSesi, fields: Object.keys(F.ANAMNESIS) },
  observasi: { model: ObservasiMental, fields: Object.keys(F.OBSERVASI_MENTAL) },
  soap: { model: CatatanSoap, fields: Object.keys(F.CATATAN_SOAP) },
};

async function get(bagian, idSesi, scope) {
  await sesiService.findSesi(idSesi, scope);
  return BAGIAN[bagian].model.findOne({ where: { id_sesi: idSesi } });
}

async function save(bagian, idSesi, scope, data) {
  const sesi = await sesiService.findSesi(idSesi, scope);
  if (sesi.status_asesmen === STATUS_SESI.BATAL) throw AppError.conflict('Sesi sudah dibatalkan');
  const { model, fields } = BAGIAN[bagian];
  const values = pick(data, fields);
  if (bagian === 'soap' && Array.isArray(data.intervensi)) values.intervensi = data.intervensi.join(';');
  const row = await model.findOne({ where: { id_sesi: idSesi } });
  if (row) return row.update(values);
  return model.create({ id_sesi: idSesi, ...values });
}

module.exports = { get, save, BAGIAN };
