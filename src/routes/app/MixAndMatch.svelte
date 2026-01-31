<script lang="ts">
  import { page } from '$app/state';
  import { Button } from '$lib/components/ui/button';
  import { OutfitItemCard } from '$lib/components/wardrobe';
  import Globals from '$lib/globals.svelte';
  import i18n from '$lib/i18n';
  import { type ClothingItem, clothingItemTypes, type SwiperCard } from '$lib/types';
  import { hashStringToNumber } from '$lib/utils';
  import { getLocalTimeZone, type CalendarDate } from '@internationalized/date';
  import { ChevronRight } from '@lucide/svelte';
  import { onDestroy, onMount } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';

  interface Props {
    onSwiped: (card: SwiperCard, accepted: boolean) => void;
    provisionalDate: CalendarDate | null;
  }

  let { onSwiped, provisionalDate }: Props = $props();
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
        createdAt: provisionalDate?.toDate(getLocalTimeZone()) ?? new Date(),
      },
    };
    onSwiped(card, true);
  }

  onMount(() => {
    Globals.navComponentReplacement = createButton;
  });

  onDestroy(() => {
    Globals.navComponentReplacement = null;
  });
</script>

{#snippet createButton()}
  <div
    class="flex flex-row pl-4 h-full items-center justify-between gap-2 w-full text-background dark:text-foreground"
  >
    <p class="text-base font-medium font-mono">
      {i18n.t('wardrobe.outfitGeneration.mixAndMatch.createButton')}
    </p>
    <Button
      disabled={selectedItems.size === 0}
      class="aspect-square w-auto h-full dark:bg-primary bg-background rounded-full text-foreground dark:text-background"
      variant="default"
      onclick={onCreate}
    >
      <ChevronRight class="size-4" />
    </Button>
  </div>
{/snippet}

<div class="grid gap-4 p-2" style="grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));">
  {#each items as item (item.id)}
    {@const selected = selectedItems.has(item.id)}
    {@const seed = hashStringToNumber(item.id) / (item.id.length * 1000)}
    {@const rotate =
      (Math.sin(seed * 34) * 43758 - Math.floor(Math.sin(seed * 34) * 43758)) * 4 - 2}
    {@const scale =
      (Math.sin(seed * 57) * 43758 - Math.floor(Math.sin(seed * 57) * 43758)) * 0.05 + 0.8}
    <OutfitItemCard
      {item}
      element="button"
      onclick={() => toggleSelect(item.id)}
      class={{ container: `transition-all` }}
      style="transform: rotate({selected ? rotate : 0}deg) scale({selected ? scale : 1});"
    />
  {/each}
</div>
