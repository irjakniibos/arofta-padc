import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';

const STYLES = {
  error: ['bg-danger-tint text-danger', CircleAlert],
  success: ['bg-success-tint text-success', CircleCheck],
  warning: ['bg-warning-tint text-warning', TriangleAlert],
  info: ['bg-info-tint text-info', Info],
};

export default function Alert({ type = 'info', title, children, className = '' }) {
  const [cls, Icon] = STYLES[type];
  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={`flex gap-3 rounded-control px-4 py-3 text-sm ${cls} ${className}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-0.5' : ''}>{children}</div>}
      </div>
    </div>
  );
}
