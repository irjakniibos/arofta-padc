'use client';

/** Catatan klinis internal (Anamnesis, Observasi status mental, SOAP). Admin hanya dapat membaca. */
import { useState } from 'react';
import Tabs from '@/components/ui/Tabs';
import Alert from '@/components/ui/Alert';
import FormSimpan from '@/components/form/FormSimpan';
import DataView from './DataView';
import { api } from '@/lib/api';
import { ANAMNESIS, OBSERVASI, SOAP } from '@/lib/form-defs';

const BAGIAN = { anamnesis: ANAMNESIS, observasi: OBSERVASI, soap: SOAP };

function Bagian({ bagian, data, editable, idSesi, onSaved, disabled }) {
  if (!editable) return <DataView sections={BAGIAN[bagian]} data={data} kosong="Belum ada catatan." />;
  return (
    <FormSimpan sections={BAGIAN[bagian]} initial={data} disabled={disabled} label="Simpan catatan" pesanSukses="Catatan tersimpan"
      note="Catatan ini hanya dapat dilihat psikolog penangani dan admin." onReload={onSaved}
      save={(body) => api.put(`/psikolog/sesi/${idSesi}/${bagian}`, body)} />
  );
}

export default function CatatanKlinis({ sesi, editable, onSaved }) {
  const [tab, setTab] = useState('anamnesis');
  const disabled = sesi.status_asesmen === 'Batal';
  return (
    <div>
      {disabled && <Alert type="info" className="mb-4">Sesi dibatalkan, catatan tidak dapat diubah.</Alert>}
      <Tabs className="mb-5" value={tab} onChange={setTab} tabs={[
        { value: 'anamnesis', label: 'Riwayat & anamnesis' }, { value: 'observasi', label: 'Observasi status mental' }, { value: 'soap', label: 'Catatan konseling (SOAP)' },
      ]} />
      <Bagian key={tab} bagian={tab} data={sesi[tab]} editable={editable} idSesi={sesi.id_sesi} onSaved={onSaved} disabled={disabled} />
    </div>
  );
}
