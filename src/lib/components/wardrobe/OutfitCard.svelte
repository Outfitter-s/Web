<script lang="ts">
  import type { ClothingItem, Outfit } from '$lib/types';
  import { cn, DateUtils, hashStringToNumber } from '$lib/utils';
  import type { SvelteHTMLElements } from 'svelte/elements';

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

  const generateOutfitItemCss = (item: ClothingItem, index: number, total: number) => {
    const seed = hashStringToNumber(item.id) / (item.id.length * 1000);
    const random1 = Math.sin(seed * 12) * 43758;
    const random2 = Math.sin(seed * 78) * 43758;
    const random3 = Math.sin(seed * 45) * 43758;

    const cols = Math.ceil(Math.sqrt(total));
    const rows = Math.ceil(total / cols);

    const row = Math.floor(index / cols);
    const col = index % cols;

    const spreadFactor = 0.85;
    const availableWidth = 100 * spreadFactor;
    const availableHeight = 100 * spreadFactor;

    const offsetX = (100 - availableWidth) / 2;
    const offsetY = (100 - availableHeight) / 2;

    const cellWidth = availableWidth / cols;
    const cellHeight = availableHeight / rows;

    const baseX = offsetX + (col + 0.5) * cellWidth;
    const baseY = offsetY + (row + 0.5) * cellHeight;

    const jitterX = (random1 - Math.floor(random1)) * (cellWidth * 0.5) - cellWidth * 0.25;
    const jitterY = (random2 - Math.floor(random2)) * (cellHeight * 0.5) - cellHeight * 0.25;

    const leftPercent = baseX + jitterX;
    const topPercent = baseY + jitterY;
    const rotation = (random3 - Math.floor(random3)) * 60 - 30;
    const zIndex = index;

    const size = Math.max(25, 45 - total * 1.5);

    return `left: ${leftPercent}%; top: ${topPercent}%; width: ${size}%; transform: translate(-50%, -50%) rotate(${rotation}deg); z-index: ${zIndex};`;
  };
</script>

{#snippet outfitCard(item: ClothingItem, index: number, total: number)}
  <!-- This is a single clothing piece of an outfit -->
  <!-- All of the outfit's items will be oriented and stacked -->
  <!-- randomly like a stack of pictures dropped onto the floor -->
  {#key item.id}
    <div
      class="absolute overflow-hidden rounded-lg aspect-3/4"
      style={generateOutfitItemCss(item, index, total)}
    >
      <img src={item.imageUrl} alt={item.name} class="size-full object-cover select-none" />
    </div>
  {/key}
{/snippet}

{#snippet content()}
  {#if showDate}
    <div class="border-border relative w-fit bg-card rounded-lg border px-2 py-1">
      <p class="font-medium text-base">
        {DateUtils.formatDate(outfit.createdAt)}
      </p>
    </div>
  {/if}
  <div class="relative aspect-square isolate">
    {#each outfit.items as item, index (item.id)}
      {@render outfitCard(item, index, outfit.items.length)}
    {/each}
  </div>
{/snippet}

{#if href}
  <a {href} class={cn('w-full', className)} draggable="false" {...restProps}>
    {@render content()}
  </a>
{:else}
  <div class={cn('w-full', className)} draggable="false" {...restProps}>
    {@render content()}
  </div>
{/if}
