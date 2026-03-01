export type ToastVariant = 'success' | 'error';

export interface ToastEventDetail {
  message: string;
  variant: ToastVariant;
}

export function showToast(variant: ToastVariant, message?: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const normalized = (message || '').trim();
  if (!normalized) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<ToastEventDetail>('app-toast', {
      detail: {
        variant,
        message: normalized,
      },
    }),
  );
}
