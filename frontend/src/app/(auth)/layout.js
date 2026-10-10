import Link from 'next/link';
import Logo from '@/components/brand/Logo';

export default function AuthLayout({ children }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="hidden flex-col justify-between bg-violet-deep px-12 py-10 text-white lg:flex">
        <div className="w-fit rounded-control bg-white px-3 py-2"><Logo /></div>
        <div className="max-w-md">
          <p className="font-serif text-[34px] leading-tight">
            Satu akun untuk jadwal, formulir, pembayaran, dan laporan hasil pemeriksaan Anda.
          </p>
          <p className="mt-5 text-[15px] leading-relaxed text-white/75">
            Data pribadi dan hasil pemeriksaan hanya dapat dilihat oleh Anda, psikolog yang menangani, dan pengelola AROFTA PADC.
          </p>
        </div>
        <p className="text-[13px] text-white/60">AROFTA Psychological Assessment and Development Center</p>
      </aside>
      <main className="flex flex-col px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between lg:justify-end">
          <span className="lg:hidden"><Logo /></span>
          <Link href="/" className="text-sm text-ink-soft hover:text-ink">Kembali ke beranda</Link>
        </div>
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10">{children}</div>
      </main>
    </div>
  );
}
