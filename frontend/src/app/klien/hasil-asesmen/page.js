import { redirect } from 'next/navigation';

/** Alamat lama dari email "laporan telah terbit" yang sudah terkirim; diarahkan ke menu Hasil asesmen. */
export default function HasilAsesmenLama() {
  redirect('/klien/hasil');
}
