<script lang="ts">
  import { Button } from './ui/button';
  import { ChevronLeft } from '@lucide/svelte';
  import Globals from '$lib/globals.svelte';
  import { cn } from '$lib/utils';
  import { slide } from 'svelte/transition';
</script>

{#if Globals.navBack.shown}
  <nav class="bg-foreground text-background dark:text-foreground dark:bg-secondary">
    <div class="max-w-250 h-16 p-2 flex flex-row w-full justify-start items-center mx-auto">
      {#if Globals.navBack.backButton.shown}
        <div class="ltr:mr-2 rtl:mr-0" transition:slide={{ duration: 300, axis: 'x' }}>
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
          'font-medium text-lg font-mono',
          !Globals.navBack.backButton.shown && 'ltr:ml-2 rtl:mr-2'
        )}
      >
        {@html Globals.pageTitle}
      </p>
    </div>
  </nav>
{/if}
