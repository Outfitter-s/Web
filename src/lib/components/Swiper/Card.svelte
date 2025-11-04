<script lang="ts">
  import type { SwiperCard } from '$lib/types';
  import { cn } from '$lib/utils';
  import { Check, X } from '@lucide/svelte';
  import { onMount } from 'svelte';

  interface Props {
    card: SwiperCard;
    index: number;
    onSwiped?: (card: SwiperCard, accepted: boolean) => void;
  }

  const outfitParts = $derived(
    () =>
      [
        card.outfit.top && card.outfit.top.length > 0,
        !!card.outfit.bottom,
        !!card.outfit.shoes,
        card.outfit.accessories && card.outfit.accessories.length > 0,
      ].filter(Boolean).length
  );

  let { card, onSwiped, index }: Props = $props();

  let move = $state({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isDragging: false,
    isSwiped: false,
  });

  let MOVE_ACCEPT_THRESHOLD = $state(100);
  let imageLoaded = $state(false);

  onMount(() => {
    MOVE_ACCEPT_THRESHOLD = Math.min(window.innerWidth / 4, 150);
  });

  function onTouchStart(event: TouchEvent) {
    move.startX = event.touches[0].clientX;
    move.startY = event.touches[0].clientY;
    move.isDragging = true;
  }
  function onTouchMove(event: TouchEvent) {
    if (!move.isDragging) return;
    move.currentX = event.touches[0].clientX - move.startX;
    move.currentY = event.touches[0].clientY - move.startY;
    if (Math.abs(move.currentX) > Math.abs(move.currentY)) {
      event.preventDefault();
    }
  }
  function onTouchEnd() {
    move.isDragging = false;
    if (Math.abs(move.currentX) > MOVE_ACCEPT_THRESHOLD) {
      // Animate off-screen
      move.isSwiped = true;
      if (move.currentX > 0) {
        move.currentX = window.innerWidth; // Swipe right
      } else {
        move.currentX = -window.innerWidth; // Swipe left
      }
      if (onSwiped) onSwiped(card, move.currentX > 0);
    } else {
      move.currentX = 0;
      move.currentY = 0;
    }
  }

  function onMouseDown(event: MouseEvent) {
    move.startX = event.clientX;
    move.startY = event.clientY;
    move.isDragging = true;
  }

  function onMouseMove(event: MouseEvent) {
    if (!move.isDragging) return;
    move.currentX = event.clientX - move.startX;
    move.currentY = event.clientY - move.startY;
  }

  function onMouseUp() {
    move.isDragging = false;
    if (Math.abs(move.currentX) > MOVE_ACCEPT_THRESHOLD) {
      // Animate off-screen
      if (move.currentX > 0) {
        move.currentX = window.innerWidth; // Swipe right
      } else {
        move.currentX = -window.innerWidth; // Swipe left
      }
      move.isSwiped = true;
      if (onSwiped) onSwiped(card, move.currentX > 0);
    } else {
      move.currentX = 0;
      move.currentY = 0;
    }
  }

  function onMouseLeave() {
    if (move.isDragging) {
      move.isDragging = false;
      move.currentX = 0;
      move.currentY = 0;
    }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="absolute top-1/2 left-1/2 h-fit max-h-full w-full select-none"
  ontouchstart={onTouchStart}
  ontouchmove={onTouchMove}
  ontouchend={onTouchEnd}
  onmousedown={onMouseDown}
  onmousemove={onMouseMove}
  onmouseup={onMouseUp}
  onmouseleave={onMouseLeave}
  style="transform: translate(calc(-50% + {move.currentX}px), calc(-50% + {move.currentY}px)) rotate({move.currentX /
    20}deg); transition: {move.isDragging ? 'none' : 'transform 0.3s ease'}; z-index: {100 -
    index}; transition: {move.isSwiped ? 'transform 0.3s ease-out' : ''};"
>
  <div
    class={cn(
      'bg-card border-border relative overflow-hidden border transition-all duration-300',
      Math.abs(move.currentX) > MOVE_ACCEPT_THRESHOLD ? 'rounded-3xl' : 'rounded-xl'
    )}
  >
    <div class="relative z-0 aspect-square w-full">
      {#if !imageLoaded}
        <div class="bg-accent absolute inset-0 -z-10 aspect-square animate-pulse"></div>
      {/if}
      <div
        class="bg-card grid h-[700px] min-h-[500px] gap-2 overflow-hidden p-4"
        style="grid-template-rows: repeat({outfitParts}, 1fr);"
      >
        {#if card.outfit.top && card.outfit.top.length > 0}
          <div class="flex h-full flex-col gap-1 overflow-hidden rounded-lg bg-gray-900 p-2">
            <div
              class="grid h-full"
              style="grid-template-columns: repeat({card.outfit.top.length}, 1fr); gap: 0.5rem;"
            >
              {#each card.outfit.top as topItem}
                <div class="flex h-full w-full flex-col items-center overflow-hidden">
                  <img
                    src={topItem.imageUrl}
                    alt={topItem.name}
                    class="h-full w-auto rounded-lg object-contain"
                    style="max-height: 100%; max-width: 100%;"
                  />
                  <!-- <span>{topItem.name}</span> -->
                </div>
              {/each}
            </div>
          </div>
        {/if}
        {#if card.outfit.bottom}
          <div
            class="flex h-full w-full flex-col items-center overflow-hidden rounded-lg bg-gray-900 p-2"
          >
            <img
              src={card.outfit.bottom.imageUrl}
              alt={card.outfit.bottom.name}
              class="h-full w-auto rounded-lg object-contain"
              style="max-height: 100%;"
            />
            <!-- <span>{card.outfit.bottom.name}</span> -->
          </div>
        {/if}
        {#if card.outfit.accessories && card.outfit.accessories.length > 0}
          <div class="flex h-full flex-col gap-1 overflow-hidden rounded-lg bg-gray-900 p-2">
            <div
              class="grid h-full"
              style="grid-template-columns: repeat({card.outfit.accessories
                .length}, 1fr); gap: 0.5rem;"
            >
              {#each card.outfit.accessories as accessory}
                <div class="flex h-full w-full flex-col items-center overflow-hidden">
                  <img
                    src={accessory.imageUrl}
                    alt={accessory.name}
                    class="h-full w-auto rounded-lg object-contain"
                    style="max-height: 100%; max-width: 100%;"
                  />
                  <!-- <span class="text-xs">{accessory.name}</span> -->
                </div>
              {/each}
            </div>
          </div>
        {/if}
        {#if card.outfit.shoes}
          <div
            class="flex h-full w-full flex-col items-center overflow-hidden rounded-lg bg-gray-900 p-2"
          >
            <img
              src={card.outfit.shoes.imageUrl}
              alt={card.outfit.shoes.name}
              class="h-full w-auto rounded-lg object-contain"
              style="max-height: 100%;"
            />
            <!-- <span>{card.outfit.shoes.name}</span> -->
          </div>
        {/if}
      </div>
    </div>

    <div class="p-2">
      <h2 class="text-lg font-bold">{card.title}</h2>
      {#if card.description}
        <p class="text-muted-foreground text-sm">{card.description}</p>
      {/if}
    </div>
    <div
      class={cn(
        'absolute inset-0 flex flex-col items-center justify-center',
        move.currentX > 0
          ? 'bg-green-100/50 dark:bg-green-400/10'
          : 'bg-red-100/50 dark:bg-red-400/10'
      )}
      style:opacity={Math.max(
        0,
        Math.min(Math.abs(move.currentX) / MOVE_ACCEPT_THRESHOLD - 0.4, 1)
      )}
    >
      <div
        class={cn(
          'rounded-3xl-full size-20 p-4',
          move.currentX > 0
            ? 'bg-green-500/50 text-green-800 dark:text-green-950'
            : 'bg-red-500/50 text-red-800 dark:text-red-950'
        )}
      >
        {#if move.currentX > 0}
          <Check class="size-full" />
        {:else}
          <X class="size-full" />
        {/if}
      </div>
    </div>
  </div>
</div>
