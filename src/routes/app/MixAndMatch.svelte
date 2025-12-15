<script lang="ts">
  import { page } from '$app/state';
  import { OutfitItemCard } from '$lib/components';
  import { Button } from '$lib/components/ui/button';
  import i18n from '$lib/i18n';
  import { type ClothingItem, clothingItemTypes, type SwiperCard } from '$lib/types';
  import { hashStringToNumber } from '$lib/utils';
  import { ChevronRight } from '@lucide/svelte';
  import { backInOut } from 'svelte/easing';
  import { SvelteSet } from 'svelte/reactivity';
  import { fly } from 'svelte/transition';

  interface Props {
    onSwiped: (card: SwiperCard, accepted: boolean) => void;
  }

  let { onSwiped }: Props = $props();
  let items = $state<ClothingItem[]>(page.data.items.sort(sortByType));
  let selectedItems = $state(new SvelteSet<ClothingItem['id']>());

  function sortByType(a: ClothingItem, b: ClothingItem) {
    return clothingItemTypes.indexOf(a.type) - clothingItemTypes.indexOf(b.type);
  }

  function toggleSelect(itemId: string) {
    if (selectedItems.has(itemId)) {
      selectedItems.delete(itemId);
    } else {
      selectedItems.add(itemId);
    }
  }

  function onCreate() {
    if (selectedItems.size === 0) return;
    const card: SwiperCard = {
      id: 1000,
      outfit: {
        items: items.filter((item) => selectedItems.has(item.id)),
      },
    };
    onSwiped(card, true);
  }
</script>

{#if selectedItems.size > 0}
  <div
    class="fixed z-10 bottom-16 right-2"
    transition:fly={{ x: '100%', duration: 400, easing: backInOut }}
  >
    <Button class="gap-2 shadow-md" variant="default" onclick={onCreate}>
      {i18n.t('wardrobe.outfitGeneration.mixAndMatch.createButton')}
      <ChevronRight class="size-4" />
    </Button>
  </div>
{/if}

<div
  class="grid gap-x-6 gap-y-4 p-4"
  style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));"
>
  {#each items as item (item.id)}
    {@const selected = selectedItems.has(item.id)}
    {@const seed = hashStringToNumber(item.id) / (item.id.length * 1000)}
    {@const rotate =
      (Math.sin(seed * 34) * 43758 - Math.floor(Math.sin(seed * 34) * 43758)) * 4 - 2}
    {@const scale =
      (Math.sin(seed * 57) * 43758 - Math.floor(Math.sin(seed * 57) * 43758)) * 0.05 + 0.85}
    <OutfitItemCard
      {item}
      element="button"
      onclick={() => toggleSelect(item.id)}
      class={{ container: `transition-all ${selected && 'ring-2 ring-primary'}` }}
      style="transform: rotate({selected ? rotate : 0}deg) scale({selected ? scale : 1});"
    />
  {/each}
</div>
