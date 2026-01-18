<script lang="ts">
  import type { Outfit } from '$lib/types';
  import { cn, DateUtils } from '$lib/utils';
  import type { SvelteHTMLElements } from 'svelte/elements';
  import { OutfitItems } from '.';

  interface Props {
    outfit: Outfit;
    href?: SvelteHTMLElements['a']['href'];
    showDate?: boolean;
  }

  let {
    outfit,
    href,
    showDate = true,
    class: className,
    ...restProps
  }: Props & SvelteHTMLElements['a'] & SvelteHTMLElements['div'] = $props();
</script>

<div class="relative aspect-square isolate">
  {#if showDate}
    <div class="relative w-fit bg-card rounded-full px-4 py-2 shadow-sm">
      <p class="font-medium text-base">
        {DateUtils.formatDate(outfit.createdAt)}
      </p>
    </div>
  {/if}
  <OutfitItems
    {href}
    items={outfit.items}
    class={cn('w-full', className)}
    draggable="false"
    {...restProps}
  />
</div>
