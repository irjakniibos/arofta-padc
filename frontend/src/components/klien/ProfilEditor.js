'use client';

/**
 * Editor profil & formulir klien (data diri, formulir identitas, riwayat anak, keluarga, organisasi, referensi).
 * Dipakai klien untuk profilnya sendiri dan Admin untuk melengkapi data klien (mis. klien walk-in tanpa akun).
 * `apiBase`: /klien/profil/:id (klien) atau /admin/klien/:id (admin).
 */
import { useState } from 'react';
import Tabs from '@/components/ui/Tabs';
import Alert from '@/components/ui/Alert';
import ChildList from '@/components/klien/ChildList';
import FormSimpan from '@/components/form/FormSimpan';
import { api } from '@/lib/api';
import { PROFIL_KLIEN, INTAKE_DEWASA, INTAKE_ANAK, KELUARGA, KELUARGA_LABEL, ORGANISASI, REFERENSI } from '@/lib/form-defs';

/** Respons API memakai `pendidikanSosial`; form riwayat anak memakai `pendidikan_sosial`. */
export function normalisasiProfil(d) {
  if (d?.intakeAnak) return { ...d, intakeAnak: { ...d.intakeAnak, pendidikan_sosial: d.intakeAnak.pendidikanSosial || {} } };
  return d;
}

const FormSection = (props) => <FormSimpan {...props} className="rounded-panel border border-line bg-white px-5 pt-6" />;

export default function ProfilEditor({ data, apiBase, tabAwal = 'data', onSaved, staf = false }) {
  const [tab, setTab] = useState(tabAwal);
  const isAnak = data.hubungan_akun === 'Anak';
  const tabs = [
    { value: 'data', label: 'Data diri' },
    { value: 'dewasa', label: 'Formulir identitas klien' },
    { value: 'anak', label: 'Formulir riwayat anak' },
    { value: 'keluarga', label: 'Susunan keluarga' },
    ...(!isAnak ? [{ value: 'lainnya', label: 'Organisasi & referensi' }] : []),
  ];
  const simpan = (path) => (body) => api.put(path, body);

  return (
    <>
      <Tabs tabs={tabs} value={tab} onChange={setTab} className="mb-6" />

      {tab === 'data' && (
        <FormSection sections={PROFIL_KLIEN} initial={data} label="Simpan data diri"
          onReload={onSaved} save={(body) => { const { hubungan_akun: _h, ...rest } = body; return simpan(apiBase)(rest); }} />
      )}
      {tab === 'dewasa' && (
        <>
          <Alert type="info" className="mb-4">
            {staf ? 'Salin isian dari formulir kertas yang diisi klien. ' : ''}
            Wajib diisi untuk layanan dewasa (psikotes umum, minat bakat, rekrutmen, konseling). Centang pernyataan di bagian akhir agar
            {staf ? ' formulir dianggap lengkap.' : ' dapat memesan layanan.'}
          </Alert>
          <FormSection sections={INTAKE_DEWASA} initial={data.intakeDewasa} label="Simpan formulir" onReload={onSaved} save={simpan(`${apiBase}/intake-dewasa`)} />
        </>
      )}
      {tab === 'anak' && (
        <>
          <Alert type="info" className="mb-4">Diisi oleh orang tua/wali untuk layanan tes psikologi anak. Data orang tua dan saudara diisi di tab Susunan keluarga.</Alert>
          <FormSection sections={INTAKE_ANAK} initial={data.intakeAnak} label="Simpan formulir" onReload={onSaved} save={simpan(`${apiBase}/intake-anak`)} />
        </>
      )}
      {tab === 'keluarga' && (
        <div className="rounded-panel border border-line bg-white p-5">
          <ChildList apiBase={apiBase} jenis="keluarga" sections={KELUARGA} judul="Anggota keluarga" pk="id_keluarga" tambahLabel="Tambah anggota"
            defaults={{ kategori: isAnak ? 'Ayah' : 'Pasangan', masih_hidup: true }}
            ringkas={(r) => (
              <>
                <p className="font-medium">{r.nama} <span className="font-normal text-ink-soft">({KELUARGA_LABEL[r.kategori]}{r.status_hubungan ? `, ${r.status_hubungan.toLowerCase()}` : ''})</span></p>
                <p className="text-[13px] text-ink-faint">{[r.usia && `${r.usia}`, r.pendidikan, r.pekerjaan, !r.masih_hidup && 'sudah meninggal'].filter(Boolean).join(', ') || '-'}</p>
              </>
            )} />
        </div>
      )}
      {tab === 'lainnya' && (
        <div className="space-y-8 rounded-panel border border-line bg-white p-5">
          <ChildList apiBase={apiBase} jenis="organisasi" sections={ORGANISASI} judul="Riwayat organisasi" pk="id_organisasi"
            ringkas={(r) => <><p className="font-medium">{r.nama_organisasi}</p><p className="text-[13px] text-ink-faint">{[r.jenis_organisasi, r.jabatan, r.tahun].filter(Boolean).join(', ')}</p></>} />
          <ChildList apiBase={apiBase} jenis="referensi" sections={REFERENSI} judul="Referensi" pk="id_referensi"
            ringkas={(r) => <><p className="font-medium">{r.nama}</p><p className="text-[13px] text-ink-faint">{[r.hubungan, r.jabatan, r.alamat_telepon].filter(Boolean).join(', ')}</p></>} />
        </div>
      )}
    </>
  );
}
