import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource-variable/newsreader';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata = {
  title: {
    default: 'AROFTA PADC, Layanan Psikologi Kartasura',
    template: '%s | AROFTA PADC',
  },
  description: 'Tes psikologi anak, minat bakat, asesmen rekrutmen, dan konseling di AROFTA Psychological Assessment and Development Center, Kartasura, Sukoharjo.',
};

export const viewport = { themeColor: '#7c51a1' };

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <AuthProvider><ToastProvider>{children}</ToastProvider></AuthProvider>
      </body>
    </html>
  );
}
