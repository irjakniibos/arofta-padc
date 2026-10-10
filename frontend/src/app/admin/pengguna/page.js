'use client';

import { useState } from 'react';
import { Plus, DatabaseBackup } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Panel from '@/components/dashboard/Panel';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Tabs from '@/components/ui/Tabs';
import Pagination from '@/components/ui/Pagination';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Input, Select } from '@/components/ui/Field';
import { Loading, ErrorState } from '@/components/ui/DataState';
import SuperAdminOnly from '@/components/auth/SuperAdminOnly';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth-context';
import { useApi } from '@/lib/use-api';
import { api } from '@/lib/api';
import { ROLES } from '@/lib/config';
import { tanggalJam, isoLokal } from '@/lib/format';

const PASSWORD_HINT = 'Minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka.';
const PASSWORD_PATTERN = '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,72}';
const STAF = [ROLES.ADMIN, ROLES.SUPER_ADMIN];

const waktu = (v) => (v ? tanggalJam(v) : 'Belum pernah');

function AkunBaru({ open, onClose, onSaved }) {
  const toast = useToast();
  const [v, setV] = useState({ email: '', password: '', role: ROLES.ADMIN });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const simpan = async (e) => {
    e.preventDefault(); setSaving(true); setErrors({});
    try { await api.post('/superadmin/users', { ...v, password: v.password || undefined }); toast('Akun dibuat'); setV({ email: '', password: '', role: ROLES.ADMIN }); onSaved(); onClose(); } catch (err) { setErrors(err.fieldErrors?.() || {}); toast(err.message, 'error'); } finally { setSaving(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Akun Admin baru">
      <form onSubmit={simpan} className="space-y-4">
        <p className="text-sm text-ink-soft">Akun psikolog dibuat dari menu Psikolog, sedangkan klien mendaftar sendiri.</p>
        <Input label="Email" type="email" required maxLength={150} autoComplete="off" value={v.email} error={errors.email} onChange={(e) => setV({ ...v, email: e.target.value })} />
        <Input label="Password awal (opsional)" type="password" autoComplete="new-password" pattern={PASSWORD_PATTERN} title={PASSWORD_HINT} hint={`Kosongkan bila pemilik akun masuk dengan akun Google dari email di atas. ${PASSWORD_HINT}`} value={v.password} error={errors.password} onChange={(e) => setV({ ...v, password: e.target.value })} />
        <Select label="Role" required value={v.role} options={STAF} onChange={(e) => setV({ ...v, role: e.target.value })} />
        <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="secondary" onClick={onClose}>Batal</Button><Button type="submit" loading={saving}>Buat akun</Button></div>
      </form>
    </Modal>
  );
}

function ResetPassword({ user, onClose }) {
  const toast = useToast();
  const [pw, setPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const simpan = async (e) => {
    e.preventDefault(); setSaving(true); setErr(null);
    try { await api.patch(`/superadmin/users/${user.id_user}/password`, { password_baru: pw }); toast('Password direset. Sampaikan password baru kepada pemilik akun.'); setPw(''); onClose(); } catch (x) { setErr(x.fieldErrors?.().password_baru || x.message); } finally { setSaving(false); }
  };
  return (
    <Modal open={!!user} onClose={onClose} title="Reset password">
      <form onSubmit={simpan} className="space-y-4">
        <p className="text-sm text-ink-soft">Password baru untuk <b>{user?.email}</b>. Kunci akun karena salah login juga akan dibuka.</p>
        <Input label="Password baru" type="password" required autoComplete="new-password" pattern={PASSWORD_PATTERN} title={PASSWORD_HINT} hint={PASSWORD_HINT} error={err} value={pw} onChange={(e) => setPw(e.target.value)} />
        <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="secondary" onClick={onClose}>Batal</Button><Button type="submit" loading={saving}>Reset password</Button></div>
      </form>
    </Modal>
  );
}

function Backup() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const unduh = async () => {
    setBusy(true);
    try {
      const res = await fetch(api.fileUrl('/superadmin/backup'), { credentials: 'include' });
      if (!res.ok || (res.headers.get('content-type') || '').includes('application/json')) {
        const p = await res.json().catch(() => ({}));
        throw new Error(p.message || `Backup gagal (${res.status})`);
      }
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `backup-arofta-${isoLokal()}.sql`;
      a.click(); URL.revokeObjectURL(a.href);
      toast('Backup database diunduh');
    } catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };
  return <Button variant="secondary" loading={busy} onClick={unduh}><DatabaseBackup className="h-4 w-4" />Unduh backup database</Button>;
}

function DaftarPengguna() {
  const toast = useToast();
  const { user: saya } = useAuth();
  const [role, setRole] = useState('');
  const [q, setQ] = useState('');
  const [cari, setCari] = useState('');
  const [page, setPage] = useState(1);
  const [baru, setBaru] = useState(false);
  const [reset, setReset] = useState(null);
  const [konfirmasi, setKonfirmasi] = useState(null);
  const { data, meta, error, loading, reload } = useApi('/superadmin/users', { page, limit: 20, role, q: cari });

  const jalankan = async () => {
    const { u, jenis } = konfirmasi;
    try {
      if (jenis === 'status') await api.patch(`/superadmin/users/${u.id_user}/status`, { is_active: !u.is_active });
      else await api.patch(`/superadmin/users/${u.id_user}/role`, { role: u.role === ROLES.ADMIN ? ROLES.SUPER_ADMIN : ROLES.ADMIN });
      toast('Perubahan tersimpan'); setKonfirmasi(null); reload();
    } catch (e) { toast(e.message, 'error'); setKonfirmasi(null); }
  };

  return (
    <>
      <PageHeader title="Akun pengguna" description="Kelola akun Admin dan Super Admin, nonaktifkan akun, atau reset password pengguna yang lupa."
        action={<div className="flex flex-wrap gap-2"><Backup /><Button onClick={() => setBaru(true)}><Plus className="h-4 w-4" />Akun Admin</Button></div>} />
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <Tabs value={role} onChange={(v) => { setRole(v); setPage(1); }} tabs={[{ value: '', label: 'Semua' }, ...Object.values(ROLES).map((r) => ({ value: r, label: r }))]} />
        <form onSubmit={(e) => { e.preventDefault(); setCari(q.trim()); setPage(1); }} className="flex gap-2">
          <Input aria-label="Cari email" type="search" placeholder="Cari email" maxLength={100} value={q} onChange={(e) => setQ(e.target.value)} />
          <Button type="submit" variant="secondary">Cari</Button>
        </form>
      </div>
      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <Panel>
          <Table rowKey="id_user" rows={data} empty="Tidak ada akun yang cocok." minWidth={760}
            columns={[
              { key: 'email', label: 'Email', render: (u) => <><span className="block font-medium">{u.email}</span>{u.id_user === saya?.id_user && <span className="text-[13px] text-violet-deep">Akun Anda</span>}</> },
              { key: 'role', label: 'Role', render: (u) => u.role },
              { key: 'status', label: 'Status', render: (u) => (u.locked_until && new Date(u.locked_until) > new Date()
                ? <Badge tone="warning">Terkunci</Badge>
                : <Badge tone={u.is_active ? 'success' : 'neutral'}>{u.is_active ? 'Aktif' : 'Nonaktif'}</Badge>) },
              { key: 'login', label: 'Login terakhir', render: (u) => <span className="text-ink-soft">{waktu(u.last_login)}</span> },
              { key: 'aksi', label: '', render: (u) => (u.id_user === saya?.id_user ? null : (
                <div className="flex flex-wrap justify-end gap-1.5">
                  {STAF.includes(u.role) && <Button size="sm" variant="ghost" onClick={() => setKonfirmasi({ u, jenis: 'role' })}>Jadikan {u.role === ROLES.ADMIN ? 'Super Admin' : 'Admin'}</Button>}
                  <Button size="sm" variant="ghost" onClick={() => setReset(u)}>Reset password</Button>
                  <Button size="sm" variant={u.is_active ? 'ghost-danger' : 'ghost'} onClick={() => setKonfirmasi({ u, jenis: 'status' })}>{u.is_active ? 'Nonaktifkan' : 'Aktifkan'}</Button>
                </div>)) },
            ]} />
          <Pagination meta={meta} onPage={setPage} />
        </Panel>
      )}
      <AkunBaru open={baru} onClose={() => setBaru(false)} onSaved={reload} />
      <ResetPassword user={reset} onClose={() => setReset(null)} />
      <ConfirmDialog open={!!konfirmasi} onClose={() => setKonfirmasi(null)} onConfirm={jalankan}
        variant={konfirmasi?.jenis === 'status' && konfirmasi.u.is_active ? 'danger' : 'primary'}
        title={konfirmasi?.jenis === 'status' ? (konfirmasi.u.is_active ? 'Nonaktifkan akun?' : 'Aktifkan akun?') : 'Ubah role?'} confirmLabel="Ya, lanjutkan">
        {konfirmasi?.jenis === 'status'
          ? (konfirmasi.u.is_active ? `${konfirmasi.u.email} tidak akan bisa masuk sampai diaktifkan kembali.` : `${konfirmasi.u.email} dapat masuk kembali.`)
          : konfirmasi && `${konfirmasi.u.email} akan menjadi ${konfirmasi.u.role === ROLES.ADMIN ? 'Super Admin dengan akses penuh, termasuk kelola akun dan backup.' : 'Admin tanpa akses kelola akun dan backup.'}`}
      </ConfirmDialog>
    </>
  );
}

export default function PenggunaPage() {
  return <SuperAdminOnly><DaftarPengguna /></SuperAdminOnly>;
}
