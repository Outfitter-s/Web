<script lang="ts">
  import { onMount } from 'svelte';
  import { cn } from '$lib/utils';
  import type { SvelteHTMLElements } from 'svelte/elements';
  import { fly } from 'svelte/transition';
  import { backOut } from 'svelte/easing';

  interface Props {
    open?: boolean;
    dismissible?: boolean;
  }

  let {
    children,
    open = $bindable(false),
    dismissible = true,
    ...restProps
  }: Props & SvelteHTMLElements['div'] = $props();

  let initialPosition = $state<{ y: number }>({ y: 0 });
  let swipeY = $state(0);
  let isDragging = $state(false);
  let modalCard = $state<HTMLDivElement>();
  let closeThreshold = $state(0);
  let closePercentage = $derived(Math.min(Math.max(swipeY / closeThreshold, 0), 1) * 100);

  const handleResize = () => {
    if (modalCard && open) {
      closeThreshold = modalCard.clientHeight / 3;
    }
  };
  $effect(() => {
    handleResize();
  });

  onMount(() => {
    window.addEventListener('resize', handleResize);
    const disablePullToRefresh = (e: TouchEvent) => {
      // Prevent default action if the touch move is vertical
      if (e.touches.length > 1 || e.touches[0].clientY > 0) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', disablePullToRefresh, { passive: false });
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('touchmove', disablePullToRefresh);
    };
  });

  // Drag on mobile
  function handleTouchStart(event: TouchEvent) {
    if (isDragging) return;
    initialPosition = { y: event.touches[0].clientY };
    isDragging = true;
  }
  function handleTouchMove(event: TouchEvent) {
    if (!isDragging) return;

    const dragDistance = event.touches[0].clientY - initialPosition.y;

    swipeY = dragDistance;
    if (swipeY > closeThreshold) {
      isDragging = false;
      initialPosition = { y: 0 };
      swipeY = 0;
      open = false;
    }
  }

  function handleTouchEnd() {
    if (!isDragging || !modalCard) return;
    isDragging = false;
    // if (swipeY > closeThreshold) {
    //   open = false;
    // }
    initialPosition = { y: 0 };
    swipeY = 0;
  }

  // Drag on desktop
  function handleMouseDown(event: MouseEvent) {
    if (isDragging) return;
    initialPosition = { y: event.clientY };
    isDragging = true;
  }
  function handleMouseMove(event: MouseEvent) {
    if (!isDragging) return;

    const dragDistance = event.clientY - initialPosition.y;

    swipeY = dragDistance;
    if (swipeY > closeThreshold) {
      isDragging = false;
      initialPosition = { y: 0 };
      swipeY = 0;
      open = false;
    }
  }
  function handleMouseUp() {
    if (!isDragging || !modalCard) return;
    isDragging = false;
    initialPosition = { y: 0 };
    swipeY = 0;
  }
</script>

<svelte:window onmousemove={handleMouseMove} onmouseup={handleMouseUp} />

{#if open}
  <div
    class={cn(
      'bg-card pointer-events-auto fixed -bottom-24 left-1/2 z-50 w-full max-w-[700px] origin-bottom -translate-x-1/2 rounded-t-lg border pb-24 shadow-lg',
      !isDragging && 'transition-transform'
    )}
    style:transform={`translateY(${swipeY >= 0 ? swipeY : 0}px) scaleY(${swipeY < 0 ? -swipeY * 0.0002 + 1 : 1})`}
    transition:fly={{ y: '100%', duration: 500, easing: backOut }}
    {...restProps}
  >
    <div class="relative" bind:this={modalCard}>
      {#if dismissible}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class={cn(
            'group absolute top-0 right-0 left-0 z-10 flex h-6 flex-row items-center justify-center',
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          )}
          ontouchstart={handleTouchStart}
          ontouchmove={handleTouchMove}
          ontouchend={handleTouchEnd}
          onmousedown={handleMouseDown}
        >
          <div
            class="ease-elastic-out bg-muted-foreground/50 relative h-1 w-[40px] overflow-hidden rounded-full transition-all duration-800 group-hover:h-1.5 group-hover:w-[70px] group-active:w-[70px]"
          >
            <div
              class="bg-primary absolute top-0 bottom-0 left-0 z-10"
              style="width: {closePercentage}%; opacity: {closePercentage}%;"
            ></div>
          </div>
        </div>
      {/if}
      <div
        class="no-scrollbar grid h-fit max-h-[70vh] min-h-[20vh] w-full gap-4 overflow-y-auto p-6"
      >
        {@render children?.()}
      </div>
    </div>
  </div>
{/if}
