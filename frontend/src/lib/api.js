/**
 * Klien API untuk komponen di browser.
 * - cookie login dikirim otomatis (credentials: 'include')
 * - response backend { success, message, data, meta, errors } dinormalisasi
 * - error dilempar sebagai ApiError agar mudah ditampilkan di form
 */
import { API_URL } from './config';

export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.status = status;
    this.errors = errors || [];
  }

  /** { field: pesan } untuk ditampilkan di bawah input */
  fieldErrors() {
    return Object.fromEntries(this.errors.map((e) => [e.field, e.msg]));
  }
}

function buildUrl(path, params) {
  const url = `${API_URL}${path}`;
  if (!params) return url;
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.append(k, v);
  });
  const s = q.toString();
  return s ? `${url}?${s}` : url;
}

async function request(method, path, { body, params, signal } = {}) {
  let res;
  try {
    res = await fetch(buildUrl(path, params), {
      method,
      credentials: 'include',
      headers: body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
      signal,
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new ApiError('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.', 0);
  }

  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const payload = isJson ? await res.json() : null;

  if (!res.ok || (payload && payload.success === false)) {
    if (res.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    throw new ApiError(payload?.message || `Permintaan gagal (${res.status})`, res.status, payload?.errors);
  }
  return payload || { success: true, data: null };
}

export const api = {
  get: (path, params, opts) => request('GET', path, { params, ...opts }),
  post: (path, body) => request('POST', path, { body }),
  put: (path, body) => request('PUT', path, { body }),
  patch: (path, body) => request('PATCH', path, { body }),
  del: (path) => request('DELETE', path),
  /** URL langsung untuk unduhan file (laporan, template) */
  fileUrl: (path, params) => buildUrl(path, params),
};
