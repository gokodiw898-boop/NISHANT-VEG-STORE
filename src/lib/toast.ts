import { useCallback, useState } from 'react';

export type NotifyFn = (kind: 'success' | 'error', message: string) => void;
export interface ToastItem { id: number; kind: 'success' | 'error'; message: string }

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const notify: NotifyFn = useCallback((kind, message) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);
  return { toasts, notify };
}
