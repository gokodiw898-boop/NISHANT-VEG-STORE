interface Props {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ title, message, confirmLabel, cancelLabel = 'Cancel', danger, busy, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="font-display text-xl font-bold">{title}</h2>
        {message && <p className="mt-2 text-stone-600">{message}</p>}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          <button type="button" className={`${danger ? 'btn-danger' : 'btn-primary'} flex-1`} onClick={onConfirm} disabled={busy} autoFocus>
            {busy ? 'Please wait…' : confirmLabel}
          </button>
          <button type="button" className="btn-soft flex-1" onClick={onCancel} disabled={busy}>{cancelLabel}</button>
        </div>
      </div>
    </div>
  );
}
