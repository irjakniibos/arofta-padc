import Link from 'next/link';
import Spinner from './Spinner';

const VARIANTS = {
  primary: 'bg-violet text-white hover:bg-violet-deep disabled:bg-violet/50',
  secondary: 'bg-white text-violet-deep border border-violet-line hover:bg-violet-tint disabled:text-ink-faint',
  ghost: 'text-violet-deep hover:bg-violet-tint',
  'ghost-danger': 'text-danger hover:bg-danger-tint',
  danger: 'bg-danger text-white hover:bg-danger/90 disabled:bg-danger/50',
};
const SIZES = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-[15px]',
};

export default function Button({ variant = 'primary', size = 'md', href, loading = false, className = '', children, ...props }) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
  if (href) return <Link href={href} className={cls} {...props}>{children}</Link>;
  return (
    <button className={cls} disabled={loading || props.disabled} {...props}>
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}
