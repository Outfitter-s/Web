<script lang="ts">
  import type { SwiperCard } from '$lib/types';
  import { onMount } from 'svelte';
  import Card from './Card.svelte';

  interface Props {
    cards: SwiperCard[];
    onSwiped?: (card: SwiperCard, accepted: boolean) => void;
  }

  let { cards = $bindable([]), onSwiped }: Props = $props();

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

    // Add event listener to the document
    document.addEventListener('touchmove', disablePullToRefresh, { passive: false });

    // Clean up the event listener on unmount
    return () => {
      document.removeEventListener('touchmove', disablePullToRefresh);
    };
  });
</script>

<div class="relative z-10 h-full w-full grow" style="overscroll-behavior-y: contain;">
  <div
    class="text-muted-foreground absolute inset-0 flex flex-col items-center justify-center p-4 text-center"
  >
    <p class="mb-2">No more outfits</p>
    <p class="text-sm">Please come back later.</p>
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
</div>
