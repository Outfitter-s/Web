<script lang="ts">
  import type { ClothingItem } from '$lib/types';
  import { capitalize, cn } from '$lib/utils';
  import type { SvelteHTMLElements } from 'svelte/elements';

  interface Props {
    item: ClothingItem;
    href?: string;
  }

  let {
    item,
    href,
    class: className,
    ...restProps
  }: Props & SvelteHTMLElements['a'] & SvelteHTMLElements['button'] = $props();
</script>

{#snippet content()}
  <div class="-ml-2 -mt-2 -mr-2 inline-block">
    <img src={item.imageUrl} alt={item.name} class="size-full object-contain rounded-lg" />
  </div>
  <div class="p-2 w-full text-center">
    <p class="font-medium text-sm font-mono text-wrap">{capitalize(item.name)}</p>
  </div>
{/snippet}

{#if href}
  <a
    {href}
    class={cn('flex flex-col rounded-lg bg-card border border-border items-center', className)}
    {...restProps}
  >
    {@render content()}
  </a>
{:else}
  <div
    class={cn('flex flex-col rounded-lg bg-card border border-border items-center', className)}
    {...restProps}
  >
    {@render content()}
  </div>
{/if}
