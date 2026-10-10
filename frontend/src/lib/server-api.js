/**
 * Pengambilan data publik dari Server Component (render di server, cepat & SEO-friendly).
 * Hanya dipakai untuk endpoint publik; data pribadi selalu diambil dari browser.
 */
import 'server-only';

const backend = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');
const prefix = process.env.NEXT_PUBLIC_API_PREFIX || '/api/v1';

export async function serverGet(path, { revalidate = 60, fallback = null } = {}) {
  try {
    const res = await fetch(`${backend}${prefix}${path}`, { next: { revalidate } });
    if (!res.ok) return fallback;
    const json = await res.json();
    return json.data ?? fallback;
  } catch {
    return fallback;
  }
}

export async function serverGetFull(path, { revalidate = 60 } = {}) {
  try {
    const res = await fetch(`${backend}${prefix}${path}`, { next: { revalidate } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
