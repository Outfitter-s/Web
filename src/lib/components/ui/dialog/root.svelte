<script lang="ts">
  import { Backdrop, portal } from '.';
  import MobileModal from './mobile.svelte';
  import type { SvelteHTMLElements } from 'svelte/elements';

  interface MyProps {
    open: boolean;
    dismissible?: boolean;
    noBackdropClose?: boolean;
    usePortal?: boolean;
    backdropClasses?: string;
  }

  let {
    children,
    open = $bindable(false),
    usePortal = true,
    noBackdropClose,
    backdropClasses,
    dismissible = true,
  }: SvelteHTMLElements['div'] & MyProps = $props();
</script>

{#if usePortal}
  <div use:portal class="portal" style="position: absolute; opacity: 0; pointer-events: none;">
    <Backdrop bind:open class={backdropClasses} noBackdropClose={noBackdropClose || !dismissible} />
    <MobileModal bind:open {dismissible}>
      {@render children?.()}
    </MobileModal>
  </div>
{:else}
  <div>
    <Backdrop bind:open class={backdropClasses} noBackdropClose={noBackdropClose || !dismissible} />
    <MobileModal bind:open {dismissible}>
      {@render children?.()}
    </MobileModal>
  </div>
{/if}
