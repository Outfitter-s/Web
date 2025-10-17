<script lang="ts">
  import { cn } from '$lib/utils';
  import type { SvelteHTMLElements } from 'svelte/elements';
  import { fade } from 'svelte/transition';

  interface MyProps {
    open: boolean;
    noBackdropClose?: boolean;
  }
  let {
    open = $bindable(false),
    class: className,
    noBackdropClose = false,
    ...restProps
  }: SvelteHTMLElements['div'] & MyProps = $props();

  function handleWindowKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && !noBackdropClose) {
      open = false;
    }
  }
</script>

<svelte:window onkeydown={handleWindowKeyDown} />

{#if open}
  <!-- Backdrop -->
  <div
    aria-label="Close sidebar"
    class={cn('bg-background/50 fixed inset-0 z-40 backdrop-blur-xs', className)}
    onclick={() => {
      if (!noBackdropClose) open = false;
    }}
    transition:fade={{ duration: 500 }}
    aria-hidden="true"
    role="button"
    tabindex="0"
    {...restProps}
  ></div>
{/if}
