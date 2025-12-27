<script lang="ts">
  import type { ClothingItem } from '$lib/types';
  import { capitalize, cn } from '$lib/utils';
  import type { SvelteHTMLElements } from 'svelte/elements';
  import IndentCard from '../IndentCard.svelte';

  interface Props {
    item: ClothingItem;
    element?: 'a' | 'button' | 'div';
    href?: string;
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
    href,
    ...restProps
  }: Props & (SvelteHTMLElements['div'] | SvelteHTMLElements['button']) = $props();
</script>

<!-- TODO: Fix props typing -->
<IndentCard class="rounded-xl" imageUrl={item.imageUrl} {href} {...restProps}>
  <span
    class={cn(
      'font-medium max-w-full text-base font-mono text-nowrap line-clamp-1',
      className?.name
    )}
  >
    {capitalize(item.name)}
  </span>
</IndentCard>
