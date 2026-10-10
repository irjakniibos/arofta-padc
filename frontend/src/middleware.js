/**
 * Melindungi halaman dashboard: tanpa cookie login diarahkan ke /masuk.
 * Pemeriksaan role yang sebenarnya tetap dilakukan backend di setiap request API.
 */
import { NextResponse } from 'next/server';

const COOKIE = process.env.AUTH_COOKIE_NAME || 'arofta_token';
const PROTECTED = ['/klien', '/psikolog', '/admin', '/superadmin'];

export function middleware(request) {
  const { pathname, search } = request.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isProtected && !request.cookies.get(COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = '/masuk';
    url.search = `?lanjut=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/klien/:path*', '/psikolog/:path*', '/admin/:path*', '/superadmin/:path*'],
};
