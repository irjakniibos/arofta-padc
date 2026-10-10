/** Label status dengan warna yang konsisten di seluruh aplikasi. */
const TONES = {
  neutral: 'bg-mist text-ink-soft',
  violet: 'bg-violet-tint text-violet-deep',
  success: 'bg-success-tint text-success',
  warning: 'bg-warning-tint text-warning',
  danger: 'bg-danger-tint text-danger',
  info: 'bg-info-tint text-info',
};

const STATUS_TONE = {
  Terdaftar: 'info', Berjalan: 'violet', Selesai: 'success', Batal: 'neutral',
  'Menunggu Pembayaran': 'warning', 'Menunggu Verifikasi': 'info', Lunas: 'success', Ditolak: 'danger',
  Draft: 'neutral', Final: 'success', 'Belum Dibayar': 'warning', 'Sudah Dibayar': 'success',
  Tersedia: 'success', Dipesan: 'violet', Ditutup: 'neutral',
};

export default function Badge({ tone, status, children, className = '' }) {
  const t = tone || STATUS_TONE[status] || 'neutral';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${TONES[t]} ${className}`}>
      {children || status}
    </span>
  );
}
