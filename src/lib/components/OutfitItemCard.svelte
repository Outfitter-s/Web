<script lang="ts">
  import type { ClothingItem } from '$lib/types';
  import { capitalize, cn } from '$lib/utils';
  import type { SvelteHTMLElements } from 'svelte/elements';

  interface Props {
    item: ClothingItem;
    element?: 'a' | 'button' | 'div';
    class?: {
      container?: string;
      image?: string;
      name?: string;
    };
  }

  let {
    item,
    element = 'div',
    class: className,
    ...restProps
  }: Props &
    (SvelteHTMLElements['a'] | SvelteHTMLElements['div'] | SvelteHTMLElements['button']) = $props();
</script>

{#snippet content()}
  <div
    class={cn(
      '-ml-2 bg-primary -mt-2 -mr-2 inline-block aspect-9/12 rounded-lg border border-border overflow-hidden',
      className?.image
    )}
  >
    <img src={item.imageUrl} alt={item.name} class="size-full object-contain" draggable="false" />
  </div>
  <div
    class={cn('p-2 w-full text-center font-medium text-sm font-mono text-wrap', className?.name)}
  >
    <span>{capitalize(item.name)}</span>
  </div>
{/snippet}

<svelte:element
  this={element}
  class={cn(
    'flex flex-col h-fit rounded-lg bg-card border border-border items-center select-none',
    className?.container
  )}
  draggable="false"
  {...restProps}
>
  {@render content()}
</svelte:element>
