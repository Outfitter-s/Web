<script lang="ts">
  import type { SvelteHTMLElements } from 'svelte/elements';
  import { cn } from 'tailwind-variants';
  import { Button } from './ui/button';
  import { ChevronLeft } from '@lucide/svelte';
  import { onMount } from 'svelte';

  interface Props {
    title: string;
    onclick?: () => void;
  }

  let {
    title,
    onclick,
    class: className,
    ...restProps
  }: Props & SvelteHTMLElements['div'] = $props();
  let pageScrollY = $state(0);

  onMount(() => {
    pageScrollY = window.scrollY;
    const listenScroll = () => {
      pageScrollY = window.scrollY;
    };
    window.addEventListener('scroll', listenScroll);

    return () => {
      window.removeEventListener('scroll', listenScroll);
    };
  });
</script>

<div
  class={cn(
    'py-2 sticky top-0 w-full z-10 transition-all',
    pageScrollY > 10 ? 'px-4' : 'px-2',
    className
  )}
  {...restProps}
>
  <div class="bg-card border border-border p-2 gap-2 items-center flex flex-row rounded-lg">
    <Button
      variant="outline"
      size="icon"
      class="size-8"
      onclick={() => {
        if (onclick) {
          onclick();
        } else {
          history.back();
        }
      }}
    >
      <ChevronLeft class="size-5" />
    </Button>
    <p class="font-medium text-base sm:text-lg">{@html title}</p>
  </div>
</div>
