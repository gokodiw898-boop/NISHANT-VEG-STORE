import type { ToastItem } from '../lib/toast';

export default function Toasts({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.kind === 'error' ? 'alert' : 'status'}
          className={`pointer-events-auto max-w-md rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-lift ${
            t.kind === 'error' ? 'bg-red-600' : 'bg-leaf-700'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
