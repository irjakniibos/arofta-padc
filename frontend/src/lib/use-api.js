'use client';

/** Hook sederhana untuk mengambil data dari API dengan status loading/error dan fungsi muat ulang. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';

export function useApi(path, params) {
  const [state, setState] = useState({ data: null, meta: null, error: null, loading: true });
  const key = JSON.stringify(params || {});
  const ctrlRef = useRef(null);

  const load = useCallback(() => {
    if (!path) return Promise.resolve();
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setState((s) => ({ ...s, loading: true, error: null }));
    // Mengembalikan promise agar pemanggil bisa menunggu data terbaru (mis. setelah simpan)
    return api.get(path, JSON.parse(key), { signal: ctrl.signal })
      .then((r) => setState({ data: r.data, meta: r.meta || null, error: null, loading: false }))
      .catch((e) => { if (e.name !== 'AbortError') setState({ data: null, meta: null, error: e.message, loading: false }); });
  }, [path, key]);

  useEffect(() => { load(); return () => ctrlRef.current?.abort(); }, [load]);

  return { ...state, reload: load };
}
