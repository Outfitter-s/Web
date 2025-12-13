import type { EffectiveMode, Mode, Theme } from './theming/index.svelte';

class GlobalsClass {
  theme = $state<{ mode: { mode: Mode; effective: EffectiveMode }; theme: Theme }>({
    mode: {
      mode: 'system',
      effective: 'dark',
    },
    theme: 'sleek-black',
  });
}

const Globals = new GlobalsClass();

export default Globals;
