import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  cn,
  noop,
  urlStartsWith,
  capitalize,
  copyToClipboard,
  isMobile,
  navHeight,
} from '../../../src/lib/utils';

// 1. Mock Svelte Reactivity
vi.mock('svelte/reactivity', () => {
  return {
    MediaQuery: class {
      query: string;
      current = false;
      constructor(query: string) {
        this.query = query;
      }
    },
  };
});

describe('utils', () => {
  describe('cn', () => {
    it('merges tailwind classes correctly', () => {
      // Conflict resolution: p-4 should win over p-2
      expect(cn('p-2', 'p-4')).toBe('p-4');
    });

    it('handles conditional classes objects', () => {
      // FIX: We use non-conflicting classes (padding vs margin)
      // so twMerge doesn't delete one of them.
      // 'flex' and 'hidden' are both display properties, so twMerge removes 'flex'.
      expect(cn('p-2', { 'm-2': true, 'm-4': false })).toBe('p-2 m-2');
    });

    it('handles arrays and mixed inputs', () => {
      expect(cn(['text-red-500', 'bg-blue-500'], 'p-1')).toBe('text-red-500 bg-blue-500 p-1');
    });

    it('filters out falsy values', () => {
      // FIX: Use non-conflicting classes.
      // 'flex' and 'grid' conflict, so 'grid' overwrites 'flex'.
      // Here we use 'relative' (position) and 'w-full' (width).
      expect(cn('relative', undefined, null, false, 'w-full')).toBe('relative w-full');
    });
  });

  describe('noop', () => {
    it('returns undefined and accepts arguments', () => {
      expect(noop()).toBeUndefined();
      expect(noop(1, 'a', {})).toBeUndefined();
    });
  });

  describe('capitalize', () => {
    it('capitalizes the first letter of a string', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('handles already capitalized strings', () => {
      expect(capitalize('World')).toBe('World');
    });

    it('handles empty strings', () => {
      expect(capitalize('')).toBe('');
    });

    it('handles single characters', () => {
      expect(capitalize('a')).toBe('A');
    });
  });

  describe('urlStartsWith', () => {
    it('returns true if url starts with string path', () => {
      expect(urlStartsWith('/dashboard/user', '/dashboard')).toBe(true);
    });

    it('returns false if url does not start with string path', () => {
      expect(urlStartsWith('/settings', '/dashboard')).toBe(false);
    });

    it('handles RegExp paths', () => {
      expect(urlStartsWith('/api/v1/users', /\/api\/v\d\//)).toBe(true);
      expect(urlStartsWith('/dashboard', /\/api\//)).toBe(false);
    });

    it('handles Array of paths (OR condition)', () => {
      const reg = /\/auth\//;
      // FIX: Ensure the regex is actually IN the array
      const paths = ['/home', '/admin', reg];

      expect(urlStartsWith('/admin/settings', paths)).toBe(true);
      expect(urlStartsWith('/auth/login', paths)).toBe(true);
      expect(urlStartsWith('/about', reg)).toBe(false);
    });

    it('returns true for single character paths (e.g. root "/")', () => {
      expect(urlStartsWith('/any/url/here', '/')).toBe(true);
    });
  });

  describe('copyToClipboard', () => {
    let execCommandMock: any;
    let appendChildMock: any;
    let removeChildMock: any;
    let writeTextMock: any;

    beforeEach(() => {
      vi.restoreAllMocks();

      // Mock document.execCommand
      execCommandMock = vi.fn();
      Object.defineProperty(document, 'execCommand', {
        value: execCommandMock,
        configurable: true,
        writable: true,
      });

      // FIX: Use .mockImplementation() to prevent JSDOM from checking if the input is a real Node
      // We simply return the node passed in (mimicking successful append)
      appendChildMock = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
      removeChildMock = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

      // Mock Clipboard API
      writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        configurable: true,
        writable: true,
      });
    });

    it('uses navigator.clipboard.writeText when available', async () => {
      const text = 'Hello World';
      copyToClipboard(text);
      expect(writeTextMock).toHaveBeenCalledWith(text);
      expect(execCommandMock).not.toHaveBeenCalled();
    });

    it('falls back to document.execCommand when clipboard API is missing', () => {
      // @ts-expect-error deleting property for test
      delete navigator.clipboard;

      const text = 'Fallback Text';

      const selectMock = vi.fn();
      const elementMock = {
        value: '',
        select: selectMock,
        setAttribute: vi.fn(),
        style: {},
      } as unknown as HTMLTextAreaElement;

      vi.spyOn(document, 'createElement').mockReturnValue(elementMock);

      copyToClipboard(text);

      expect(document.createElement).toHaveBeenCalledWith('textarea');
      expect(elementMock.value).toBe(text);
      expect(appendChildMock).toHaveBeenCalledWith(elementMock);
      expect(selectMock).toHaveBeenCalled();
      expect(execCommandMock).toHaveBeenCalledWith('copy');
    });
  });
});
