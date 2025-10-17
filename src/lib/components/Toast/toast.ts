import { writable, type Writable } from 'svelte/store';
import type { ButtonVariant } from '$lib/components/ui/button';

export type ToastType = 'success' | 'error' | 'info' | 'warning';
type ToastActionButtonVariants = ButtonVariant;
interface ToastActionLink {
  type: 'link';
  href: string;
}
interface ToastActionButton {
  type: 'button';
  onClick: () => void;
}
export type ToastAction = { label: string; variant?: ToastActionButtonVariants } & (
  | ToastActionLink
  | ToastActionButton
);
interface ToastOptions {
  id?: string;
  timeout?: number;
  actions?: ToastAction[];
}

export interface Toast {
  type: ToastType;
  message: string;
  id: string;
  options: ToastOptions;
}
export const toasts: Writable<Toast[]> = writable([]);

const generateId = () => Date.now().toString() + Math.floor(Math.random() * 10000).toString();

function newToast(type: ToastType, message: string, options: ToastOptions): string {
  if (options.id) {
    removeToast(options.id);
  }
  const defaultOptions: ToastOptions = {
    timeout: 5000, // Default timeout of 5 seconds
    actions: [],
  };
  const newToast: Toast = {
    type: type,
    message,
    id: options.id || generateId(),
    options: { ...defaultOptions, ...options },
  };
  // Add the new toast to the beginning of toasts the array.
  toasts.update((oldToast) => {
    oldToast.push(newToast);
    return oldToast;
  });

  // Automatically remove the toast after the specified timeout.
  if (newToast.options.timeout) {
    setTimeout(() => {
      removeToast(newToast.id);
    }, newToast.options.timeout);
  }

  return newToast.id;
}

function removeToast(id: Toast['id']) {
  toasts.update((all) => all.filter((t) => t.id !== id));
}

export class Toaster {
  static success(message: string, options: ToastOptions = {}): string {
    return newToast('success', message, options);
  }

  static warning(message: string, options: ToastOptions = {}): string {
    return newToast('warning', message, options);
  }

  static error(message: string, options: ToastOptions = {}): string {
    return newToast('error', message, options);
  }

  static info(message: string, options: ToastOptions = {}): string {
    return newToast('info', message, options);
  }

  static remove(id: string) {
    removeToast(id);
  }
}
