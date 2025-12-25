<script lang="ts">
  import { Button } from './ui/button';
  import { ChevronLeft } from '@lucide/svelte';
  import Globals from '$lib/globals.svelte';
  import { cn } from '$lib/utils';
  import { slide } from 'svelte/transition';
  import { onMount } from 'svelte';

  let scrollY = $state<number>(0);
  const MAX_SCROLL_TRANSFORM = 50;
  const NAV_HEIGHTS = {
    expanded: 16,
    collapsed: 10,
  };
  let height = $derived(
    Globals.navBack.backButton.shown
      ? NAV_HEIGHTS.expanded
      : scrollY >= MAX_SCROLL_TRANSFORM
        ? NAV_HEIGHTS.collapsed
        : NAV_HEIGHTS.expanded -
          (scrollY / MAX_SCROLL_TRANSFORM) * (NAV_HEIGHTS.expanded - NAV_HEIGHTS.collapsed)
  );
  let heightPercent = $derived(
    (height - NAV_HEIGHTS.collapsed) / (NAV_HEIGHTS.expanded - NAV_HEIGHTS.collapsed)
  ); // From 0 to 1 => collapsed to expanded

  onMount(() => {
    const onScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener('scroll', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  });
</script>

{#if Globals.navBack.shown}
  <nav class="bg-secondary dark:text-foreground dark:bg-secondary sticky top-0 z-20 left-0 right-0">
    <div
      class={cn('max-w-250 p-2 flex flex-row w-full justify-start items-center mx-auto')}
      style="height: calc(var(--spacing) * {height});"
    >
      {#if Globals.navBack.backButton.shown}
        <div class="ltr:mr-2 rtl:mr-0 shrink-0" transition:slide={{ duration: 300, axis: 'x' }}>
          <Button
            variant="none"
            class="p-2 size-12 dark:bg-primary bg-background rounded-full text-foreground dark:text-background"
            onclick={() => {
              if (Globals.navBack.backButton.action) {
                Globals.navBack.backButton.action();
              } else {
                history.back();
              }
            }}
          >
            <ChevronLeft class="size-full" />
          </Button>
        </div>
      {/if}
      <p
        class={cn(
          'font-medium text-lg font-mono shrink-0',
          !Globals.navBack.backButton.shown && 'ltr:ml-2 rtl:mr-2'
        )}
      >
        {@html Globals.pageTitle}
      </p>
      <div class="grow"></div>
      {#if Globals.navBack.trailing}
        <div
          class="shrink-0 gap-2 h-full flex flex-row items-center"
          transition:slide={{ duration: 300, axis: 'x' }}
        >
          {@render Globals.navBack.trailing({ heightPercent })}
        </div>
      {/if}
    </div>
  </nav>
{/if}
