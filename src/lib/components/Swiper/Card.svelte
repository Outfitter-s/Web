<script lang="ts">
  import type { SwiperCard } from '$lib/types';
  import { cn } from '$lib/utils';
  import { Check, X } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { OutfitItems } from '../wardrobe';

  interface Props {
    card: SwiperCard;
    index: number;
    onSwiped?: (card: SwiperCard, accepted: boolean) => void;
  }

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
  class={cn(
    'absolute top-1/2 left-1/2 h-fit w-full select-none',
    move.isSwiped ? 'pointer-events-none cursor-grabbing' : 'cursor-grab'
  )}
  ontouchstart={onTouchStart}
  ontouchmove={onTouchMove}
  ontouchend={onTouchEnd}
  onmousedown={onMouseDown}
  onmousemove={onMouseMove}
  onmouseup={onMouseUp}
  onmouseleave={onMouseLeave}
  style="transform: translate(calc(-50% + {move.currentX}px), calc(-50% + {move.currentY}px)) rotate({move.currentX /
    20}deg); transition: {!move.isDragging || move.isSwiped
    ? 'transform 0.3s ease'
    : 'none'}; z-index: {100 - index};"
>
  <div
    class={cn(
      'bg-card border-border relative overflow-hidden border h-[80dvh] transition-all duration-300',
      Math.abs(move.currentX) > MOVE_ACCEPT_THRESHOLD ? 'rounded-3xl' : 'rounded-xl'
    )}
  >
    <div class="relative z-0 size-full">
      <OutfitItems items={card.outfit.items} class="size-full" />
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
          'size-20 rounded-full p-4',
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
