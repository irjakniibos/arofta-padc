'use client';

import { useState } from 'react';
import { Download, Star } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Panel from '@/components/dashboard/Panel';
import Table from '@/components/ui/Table';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import FormUlasan, { Bintang } from '@/components/klien/FormUlasan';
import { Loading, ErrorState } from '@/components/ui/DataState';
import { useApi } from '@/lib/use-api';
import { api } from '@/lib/api';
import { tanggal } from '@/lib/format';

export default function HasilAsesmenPage() {
  const [page, setPage] = useState(1);
  const [ulas, setUlas] = useState(null);
  const { data, meta, error, loading, reload } = useApi('/klien/laporan', { page, limit: 10 });
  return (
    <>
      <PageHeader title="Hasil asesmen" description="Laporan hasil pemeriksaan psikologis yang sudah diterbitkan psikolog. Laporan bersifat rahasia, simpan dengan baik." />
      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <Panel>
          <Table rowKey="id_laporan" rows={data} empty="Belum ada laporan. Laporan muncul di sini setelah psikolog menyelesaikannya." minWidth={760}
            columns={[
              { key: 'layanan', label: 'Layanan', render: (l) => <><span className="block font-medium">{l.sesi.layanan?.nama_layanan}</span><span className="text-[13px] text-ink-soft">{l.sesi.kode_booking}</span></> },
              { key: 'klien', label: 'Diperiksa', render: (l) => l.sesi.klien?.nama_lengkap },
              { key: 'psikolog', label: 'Psikolog', render: (l) => l.sesi.psikolog?.nama_lengkap },
              { key: 'terbit', label: 'Terbit', render: (l) => tanggal(l.tanggal_final) },
              { key: 'ulasan', label: 'Ulasan', render: (l) => (l.sesi.ulasan
                ? <Bintang rating={l.sesi.ulasan.rating} className="h-4 w-4" />
                : <Button size="sm" variant="secondary" onClick={() => setUlas(l)}><Star className="h-4 w-4" />Beri ulasan</Button>) },
              { key: 'unduh', label: '', render: (l) => (
                <a href={api.fileUrl(`/laporan/${l.id_laporan}/unduh`)} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 font-semibold text-violet-deep hover:underline">
                  <Download className="h-4 w-4" />Unduh {l.format === 'pdf' ? 'PDF' : 'dokumen'}
                </a>) },
            ]} />
          <Pagination meta={meta} onPage={setPage} />
        </Panel>
      )}
      <Modal open={!!ulas} onClose={() => setUlas(null)} title="Beri ulasan" size="md">
        {ulas && (
          <>
            <p className="text-sm text-ink-soft">{ulas.sesi.layanan?.nama_layanan} bersama {ulas.sesi.psikolog?.nama_lengkap}, {tanggal(ulas.sesi.tanggal)}.</p>
            <FormUlasan idSesi={ulas.sesi.id_sesi} className="mt-4 space-y-4" onDone={() => { setUlas(null); reload(); }} />
          </>
        )}
      </Modal>
    </>
  );
}
