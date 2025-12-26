<script lang="ts">
  import { Button } from './ui/button';
  import { ChevronLeft } from '@lucide/svelte';
  import Globals from '$lib/globals.svelte';
  import { cn } from '$lib/utils';
  import { slide } from 'svelte/transition';
  import { onMount } from 'svelte';

  let scrollY = $state<number>(0);

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
  <nav class="bg-secondary dark:text-foreground sticky top-0 z-20 left-0 right-0">
    <div class={cn('max-w-250 p-2 flex h-16 flex-row w-full justify-start items-center mx-auto')}>
      {#if Globals.navBack.backButton.shown}
        <div
          class="ltr:mr-2 rtl:mr-0 shrink-0 h-full flex flex-row items-center"
          transition:slide={{ duration: 300, axis: 'x' }}
        >
          <Button
            variant="none"
            class="dark:bg-primary bg-background rounded-full text-foreground dark:text-background p-2! size-10"
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
          'font-normal text-lg shrink-0',
          !Globals.navBack.backButton.shown && 'ltr:ml-2 rtl:mr-2'
        )}
      >
        {@html Globals.pageTitle}
      </p>
      <div class="grow"></div>
      {#if Globals.navBack.trailing.length > 0}
        <div
          class="shrink-0 gap-2 h-full flex flex-row items-center"
          transition:slide={{ duration: 300, axis: 'x' }}
        >
          {#each Globals.navBack.trailing as { href, onclick, icon: Icon } (Icon)}
            <Button
              variant="none"
              class="dark:bg-primary bg-background rounded-full text-foreground dark:text-background p-2! size-10"
              {onclick}
              {href}
            >
              <Icon class="size-full" />
            </Button>
          {/each}
        </div>
      {/if}
    </div>
  </nav>
{/if}
