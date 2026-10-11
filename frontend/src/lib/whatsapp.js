/**
 * Tautan WhatsApp (wa.me) dengan pesan yang sudah terisi.
 * Nomor diambil dari pengaturan lembaga (kontak_whatsapp), tidak ditulis di komponen.
 */
import { rupiah } from './format';
import { WA_URL } from './config';

/** '0822-2888-5529' / '+62822...' -> '62822...' (format internasional tanpa tanda +) */
export function nomorWa(nomor) {
  const angka = String(nomor || '').replace(/\D/g, '');
  if (!angka) return '';
  if (angka.startsWith('62')) return angka;
  if (angka.startsWith('0')) return `62${angka.slice(1)}`;
  return angka;
}

export function tautanWa(nomor, pesan = '') {
  const n = nomorWa(nomor);
  if (!n) return '';
  return `${WA_URL}/${n}${pesan ? `?text=${encodeURIComponent(pesan)}` : ''}`;
}

/** Pesan konfirmasi pembayaran untuk admin; klien tinggal melampirkan foto bukti transfer. */
export function pesanKonfirmasiBayar(sesi) {
  return [
    'Halo AROFTA PADC, saya ingin konfirmasi pembayaran.',
    '',
    `Kode booking: ${sesi.kode_booking}`,
    `Nama: ${sesi.klien?.nama_lengkap || '-'}`,
    `Layanan: ${sesi.layanan?.nama_layanan || '-'}`,
    `Nominal: ${rupiah(sesi.pembayaran?.total_bayar)}`,
    '',
    'Foto bukti transfer saya lampirkan.',
  ].join('\n');
}
