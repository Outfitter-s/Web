import type { Dir, LangCode } from '$lib/translations/i18n.svelte';
import type { User } from '$lib/types';
import type { Mode, Theme } from '$lib/theming/index.svelte';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      user?: User;
      i18n: {
        dir: Dir;
        lang: string;
      };
      locale: LangCode;
      theme: {
        theme: Theme;
        mode: {
          mode: Mode;
          effective: EffectiveMode;
        };
      };
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
