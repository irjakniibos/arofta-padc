'use client';

/** Catatan klinis internal (Anamnesis, Observasi status mental, SOAP). Admin hanya dapat membaca. */
import { useEffect, useState } from 'react';
import Tabs from '@/components/ui/Tabs';
import Alert from '@/components/ui/Alert';
import DynamicForm from '@/components/form/DynamicForm';
import SaveBar from '@/components/form/SaveBar';
import DataView from './DataView';
import { useFormSubmit } from '@/components/form/useForm';
import { api } from '@/lib/api';
import { ANAMNESIS, OBSERVASI, SOAP, pickFields } from '@/lib/form-defs';

const BAGIAN = { anamnesis: ANAMNESIS, observasi: OBSERVASI, soap: SOAP };

function Bagian({ bagian, data, editable, idSesi, onSaved, disabled }) {
  const f = useFormSubmit(data || {});
  useEffect(() => { f.setValue(data || {}); }, [data]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!editable) return <DataView sections={BAGIAN[bagian]} data={data} kosong="Belum ada catatan." />;
  return (
    <form onSubmit={async (e) => { e.preventDefault(); const ok = await f.submit(() => api.put(`/psikolog/sesi/${idSesi}/${bagian}`, pickFields(BAGIAN[bagian], f.value)), 'Catatan tersimpan'); if (ok) onSaved(); }}>
      <DynamicForm sections={BAGIAN[bagian]} value={f.value} onChange={f.setValue} errors={f.errors} disabled={disabled} />
      {!disabled && <SaveBar saving={f.saving} label="Simpan catatan" note="Catatan ini hanya dapat dilihat psikolog penangani dan admin." />}
    </form>
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
