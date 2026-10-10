'use client';

/** Data klien untuk psikolog/admin: identitas, formulir intake, dan susunan keluarga. */
import { useState } from 'react';
import Tabs from '@/components/ui/Tabs';
import DataView from './DataView';
import { PROFIL_KLIEN, INTAKE_DEWASA, INTAKE_ANAK, KELUARGA_LABEL } from '@/lib/form-defs';
import { hitungUsia } from '@/lib/usia';

export default function DataKlien({ klien }) {
  const [tab, setTab] = useState('identitas');
  const intakeAnak = klien.intakeAnak ? { ...klien.intakeAnak, pendidikan_sosial: klien.intakeAnak.pendidikanSosial } : null;
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <p className="text-lg font-semibold">{klien.nama_lengkap}</p>
        <p className="text-sm text-ink-soft">{[klien.nomor_rekam_psikologi, klien.jenis_kelamin, klien.tanggal_lahir && hitungUsia(klien.tanggal_lahir)].filter(Boolean).join(', ')}</p>
      </div>
      <Tabs className="mb-5" value={tab} onChange={setTab} tabs={[
        { value: 'identitas', label: 'Identitas' },
        { value: 'dewasa', label: 'Formulir identitas' },
        { value: 'anak', label: 'Riwayat anak' },
        { value: 'keluarga', label: 'Keluarga', count: klien.keluarga?.length || 0 },
      ]} />
      {tab === 'identitas' && <DataView sections={PROFIL_KLIEN} data={klien} />}
      {tab === 'dewasa' && <DataView sections={INTAKE_DEWASA} data={klien.intakeDewasa} kosong="Klien belum mengisi formulir identitas." />}
      {tab === 'anak' && <DataView sections={INTAKE_ANAK} data={intakeAnak} kosong="Formulir riwayat anak belum diisi." />}
      {tab === 'keluarga' && (
        klien.keluarga?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead><tr className="border-b border-line text-left text-[12px] text-ink-faint">
                {['Hubungan', 'Nama', 'L/P', 'Usia', 'Pendidikan', 'Pekerjaan', 'Keterangan'].map((h) => <th key={h} className="py-2 pr-4 font-medium">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-line">
                {klien.keluarga.map((k) => (
                  <tr key={k.id_keluarga}>
                    <td className="py-2 pr-4">{KELUARGA_LABEL[k.kategori]}{k.status_hubungan ? ` (${k.status_hubungan.toLowerCase()})` : ''}</td>
                    <td className="py-2 pr-4 font-medium">{k.nama}</td>
                    <td className="py-2 pr-4">{k.jenis_kelamin === 'Laki-laki' ? 'L' : k.jenis_kelamin === 'Perempuan' ? 'P' : '-'}</td>
                    <td className="py-2 pr-4">{k.usia || '-'}</td>
                    <td className="py-2 pr-4">{k.pendidikan || '-'}</td>
                    <td className="py-2 pr-4">{k.pekerjaan || '-'}</td>
                    <td className="py-2 pr-4">{[k.keterangan, !k.masih_hidup && 'sudah meninggal'].filter(Boolean).join(', ') || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-ink-faint">Belum ada data keluarga.</p>
      )}
    </div>
  );
}
