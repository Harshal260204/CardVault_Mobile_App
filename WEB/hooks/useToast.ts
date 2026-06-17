'use client';

import { create } from 'zustand';

type ToastVariant = 'error' | 'success';

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastState = {
  toasts: ToastItem[];
  push: (message: string, variant?: ToastVariant) => void;
  dismiss: (id: string) => void;
};

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, variant = 'error') => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { id, message, variant }] }));
    window.setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== id),
      }));
    }, 5000);
  },
  dismiss: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));

export function useToast() {
  const push = useToastStore((state) => state.push);
  return {
    error: (message: string) => push(message, 'error'),
    success: (message: string) => push(message, 'success'),
  };
}
