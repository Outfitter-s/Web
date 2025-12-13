<script lang="ts">
  import { cn } from '$lib/utils';
  import type { SvelteHTMLElements } from 'svelte/elements';

  interface Props {
    text?: string;
    class?: {
      span?: string;
      container?: string;
    };
  }

  const {
    children,
    text,
    class: className,
    ...restProps
  }: SvelteHTMLElements['span'] & Props = $props();

  const spanClasses = cn('w-full border-b border-border', className?.span);
</script>

<div class={cn('my-4 flex flex-row items-center', className?.container)} {...restProps}>
  <span class={spanClasses}></span>
  {#if text || children}
    <div class="mx-4 flex shrink-0 flex-row items-center gap-2">
      {#if children}
        {@render children()}
      {/if}
      {#if text}
        <span class="font-mono text-sm font-medium">{text}</span>
      {/if}
    </div>
  {/if}
  <span class={spanClasses}></span>
</div>
