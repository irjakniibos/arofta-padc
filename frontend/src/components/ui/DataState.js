/** Status pemuatan data: loading, error (dengan coba lagi), atau kosong. */
import Spinner from './Spinner';
import Alert from './Alert';

export function Loading({ label = 'Memuat data' }) {
  return <div className="flex justify-center py-16"><Spinner label={label} /></div>;
}

export function ErrorState({ message, onRetry }) {
  return (
    <Alert type="error" title="Data gagal dimuat">
      {message}{' '}
      {onRetry && <button type="button" onClick={onRetry} className="font-semibold underline">Coba lagi</button>}
    </Alert>
  );
}

export function Empty({ title, children, action }) {
  return (
    <div className="rounded-panel border border-dashed border-line bg-white px-6 py-10 text-center">
      <p className="font-semibold">{title}</p>
      {children && <p className="mx-auto mt-1 max-w-md text-sm text-ink-soft">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
