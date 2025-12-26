import type { Component, Snippet } from 'svelte';
import type { EffectiveMode, Mode, Theme } from './theming/index.svelte';

class GlobalsClass {
  theme = $state<{ mode: { mode: Mode; effective: EffectiveMode }; theme: Theme }>({
    mode: {
      mode: 'system',
      effective: 'dark',
    },
    theme: 'sleek-black',
  });

  nav = $state<{ shown: boolean }>({ shown: true });
  navComponentReplacement = $state<null | Snippet>(null);
  navBack = $state<{
    shown: boolean;
    backButton: { shown: boolean; action?: () => void };
    trailing: { icon: Component; href?: string; onclick?: () => void }[];
  }>({
    shown: true,
    backButton: { shown: false },
    trailing: [],
  });
  pageTitle = $state<string>('');
}

const Globals = new GlobalsClass();

export default Globals;
