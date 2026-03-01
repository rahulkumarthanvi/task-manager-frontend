'use client';

import { useEffect, useState } from 'react';
import { ToastEventDetail } from '../../lib/toast';

interface ToastItem extends ToastEventDetail {
  id: number;
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onToast = (event: Event) => {
      const customEvent = event as CustomEvent<ToastEventDetail>;
      const detail = customEvent.detail;

      if (!detail?.message?.trim()) {
        return;
      }

      const toast: ToastItem = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        variant: detail.variant,
        message: detail.message,
      };

      setToasts((prev) => [...prev, toast]);

      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== toast.id));
      }, 3000);
    };

    window.addEventListener('app-toast', onToast as EventListener);
    return () => {
      window.removeEventListener('app-toast', onToast as EventListener);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-md border px-4 py-3 text-sm shadow-lg ${
            toast.variant === 'success'
              ? 'border-emerald-700 bg-emerald-950/95 text-emerald-100'
              : 'border-red-700 bg-red-950/95 text-red-100'
          }`}
          role="status"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
