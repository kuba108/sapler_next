'use client';

import { useEffect, useState } from 'react';

type ToastDetail = { ok: boolean; text: string };
type ToastState = ToastDetail & { id: number; leaving: boolean };

const NOTIFY_EVENT = 'admin:notify';
const VISIBLE_MS = 3000;
const LEAVE_MS = 200;

/** Fire a toast from any client component (save results, errors, ...). */
export function notify(ok: boolean, text: string) {
  window.dispatchEvent(new CustomEvent<ToastDetail>(NOTIFY_EVENT, { detail: { ok, text } }));
}

/** Mounted once in the admin layout; renders whatever `notify()` fires. */
export default function ToastHost() {
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    let nextId = 0;
    let hideTimer: ReturnType<typeof setTimeout>;
    let removeTimer: ReturnType<typeof setTimeout>;
    function handle(event: Event) {
      const { ok, text } = (event as CustomEvent<ToastDetail>).detail;
      const id = ++nextId;
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
      setToast({ ok, text, id, leaving: false });
      hideTimer = setTimeout(() => {
        setToast((current) => (current?.id === id ? { ...current, leaving: true } : current));
        removeTimer = setTimeout(() => {
          setToast((current) => (current?.id === id ? null : current));
        }, LEAVE_MS);
      }, VISIBLE_MS);
    }
    window.addEventListener(NOTIFY_EVENT, handle);
    return () => {
      window.removeEventListener(NOTIFY_EVENT, handle);
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!toast) return null;

  return (
    <div className="admin-toast-container" role="status" aria-live="polite">
      <div
        key={toast.id}
        className={`alert admin-toast ${toast.ok ? 'alert-success' : 'alert-danger'}${toast.leaving ? ' is-leaving' : ''}`}
      >
        <span className={`fa admin-toast-icon ${toast.ok ? 'fa-check-circle' : 'fa-exclamation-circle'}`} />
        <span className="admin-toast-text">{toast.text}</span>
      </div>
    </div>
  );
}
