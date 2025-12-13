<script lang="ts">
  import type { SwiperCard } from '$lib/types';
  import { onMount } from 'svelte';
  import Card from './Card.svelte';
  import Spinner from '$lib/components/Spinner';
  import i18n from '$lib/i18n';

  interface Props {
    cards: SwiperCard[];
    loading?: boolean;
    onSwiped?: (card: SwiperCard, accepted: boolean) => void;
  }

  let { cards = $bindable([]), loading = $bindable(false), onSwiped }: Props = $props();

  const removeCard = (card: SwiperCard) => {
    cards = cards.filter((c) => c.id !== card.id);
  };

  function handleSwipe(card: SwiperCard, accepted: boolean) {
    if (onSwiped) {
      onSwiped(card, accepted);
      setTimeout(() => {
        removeCard(card);
      }, 300);
    }
  }

  onMount(() => {
    const disablePullToRefresh = (e: TouchEvent) => {
      // Prevent default action if the touch move is vertical
      if (e.touches.length > 1 || e.touches[0].clientY > 0) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', disablePullToRefresh, { passive: false });

    return () => {
      document.removeEventListener('touchmove', disablePullToRefresh);
    };
  });
</script>

<div class="relative z-10 h-full w-full grow" style="overscroll-behavior-y: contain;">
  {#if loading}
    <div
      class="text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center"
    >
      <Spinner class="size-12" />
      <p class="text-sm">{i18n.t('wardrobe.outfitGeneration.swiper.loadingText')}</p>
    </div>
  {:else}
    <div
      class="text-muted-foreground absolute inset-0 flex flex-col items-center justify-center p-4 text-center"
    >
      <p class="mb-2 text-lg">{i18n.t('wardrobe.outfitGeneration.swiper.noMoreCards.title')}</p>
      <p class="text-sm">{i18n.t('wardrobe.outfitGeneration.swiper.noMoreCards.subTitle')}</p>
    </div>
    {#each cards as c, index (c.id)}
      <Card
        card={c}
        {index}
        onSwiped={(card: SwiperCard, accepted: boolean) => {
          handleSwipe(card, accepted);
        }}
      />
    {/each}
  {/if}
</div>
