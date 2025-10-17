<script lang="ts">
  import { Backdrop, portal } from '.';
  import MobileModal from './mobile.svelte';
  import type { SvelteHTMLElements } from 'svelte/elements';

  interface MyProps {
    open: boolean;
    dismissible?: boolean;
    noBackdropClose?: boolean;
    backdropClasses?: string;
  }

  let {
    children,
    open = $bindable(false),
    noBackdropClose,
    backdropClasses,
    dismissible = true,
  }: SvelteHTMLElements['div'] & MyProps = $props();
</script>

<div use:portal class="portal" style="position: absolute; opacity: 0; pointer-events: none;">
  <Backdrop bind:open class={backdropClasses} noBackdropClose={noBackdropClose || !dismissible} />
  <MobileModal bind:open {dismissible}>
    {@render children?.()}
  </MobileModal>
</div>
