import { clsx, type ClassValue } from 'clsx';
import { MediaQuery } from 'svelte/reactivity';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const noop = (...args: unknown[]) => {
  void args;
};

export function urlStartsWith(url: string, path: string | string[] | RegExp): boolean {
  if (Array.isArray(path)) return path.some((p) => urlStartsWith(url, p));
  if (path instanceof RegExp) return path.test(url);
  // For the `/` path
  if (path.length === 1) return path.at(-1) === path;

  return url.startsWith(path);
}

export function copyToClipboard(value: string) {
  if ('clipboard' in navigator) {
    navigator.clipboard.writeText(value);
  } else {
    const el = document.createElement('textarea');
    el.value = value;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }
}

export function hashStringToNumber(str: string): number {
  // Simple hash function (djb2)
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const isMobile = new MediaQuery('(max-width: 768px)');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

export * from './date';
export * from './weather';
export * from './logger';
