'use client';

/** Dialog konfirmasi untuk aksi penting (hapus, batal, finalisasi). Mendukung isian alasan. */
import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { Textarea } from './Field';

export default function ConfirmDialog({ open, onClose, onConfirm, title, children, confirmLabel = 'Ya, lanjutkan', variant = 'primary', withReason = false, reasonLabel = 'Alasan', reasonRequired = true }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true);
    try { await onConfirm(reason.trim()); setReason(''); } finally { setLoading(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button variant={variant} loading={loading} disabled={withReason && reasonRequired && !reason.trim()} onClick={submit}>{confirmLabel}</Button>
        </>
      )}>
      <div className="space-y-4 text-[15px] leading-relaxed text-ink-soft">
        {children}
        {withReason && <Textarea label={reasonLabel} required={reasonRequired} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />}
      </div>
    </Modal>
  );
}
