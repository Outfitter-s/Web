import Globals from '$lib/globals.svelte';
import { logger } from '$lib/utils/logger';

export const availableThemes = ['sleek-black', 'vercel', 'material', 'claude'] as const;
export type Theme = (typeof availableThemes)[number];
export const availableModes = ['light', 'dark', 'system'] as const;
export type Mode = (typeof availableModes)[number];
export const effectiveModes = ['light', 'dark'] as const;
export type EffectiveMode = (typeof effectiveModes)[number];

export class ThemingClass {
  getTheme(wantedTheme: string | null | undefined): Theme {
    if (wantedTheme && availableThemes.includes(wantedTheme as Theme)) {
      return wantedTheme as Theme;
    }
    return availableThemes[0];
  }

  getMode(wantedMode: string | null | undefined): Mode {
    if (wantedMode && availableModes.includes(wantedMode as Mode)) {
      return wantedMode as Mode;
    }
    return 'system';
  }

  static saveAndApply(mode: Mode, theme: Theme) {
    const applyTheme = (theme: Theme) => {
      document.documentElement.setAttribute('data-theme', theme);
    };
    const applyMode = (mode: Mode) => {
      if (availableModes.indexOf(mode) === -1) {
        mode = 'system';
      }
      let effective: EffectiveMode;
      document.documentElement.setAttribute('data-mode', mode);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.style.removeProperty('color-scheme');
      if (mode === 'light' || mode === 'dark') {
        document.documentElement.classList.add(mode);
        document.documentElement.style.setProperty('color-scheme', mode);
        effective = mode;
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
        document.documentElement.style.setProperty('color-scheme', prefersDark ? 'dark' : 'light');
        effective = prefersDark ? 'dark' : 'light';
      }
      return { mode, effective };
    };
    const updatedMode = applyMode(mode);
    applyTheme(theme);
    (async () => {
      try {
        const response = await fetch('/api/preferences/theming', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ mode: updatedMode, theme }),
        });
        if (!response.ok) {
          logger.error('Failed to save theme preferences');
        }
      } catch (error) {
        logger.error('Error saving theme preferences:', error);
      }
    })();
    return { mode: updatedMode.mode, effectiveMode: updatedMode.effective, theme };
  }

  setTheme(theme: Theme, mode?: Mode) {
    mode ??= Globals.theme.mode.mode;
    const update = ThemingClass.saveAndApply(mode, theme);
    Globals.theme.theme = update.theme;
  }

  setMode(mode: Mode, theme?: Theme) {
    theme ??= Globals.theme.theme;
    const update = ThemingClass.saveAndApply(mode, theme);
    Globals.theme.mode.mode = update.mode;
    Globals.theme.mode.effective = update.effectiveMode;
  }
}

const Theming = new ThemingClass();

export default Theming;
