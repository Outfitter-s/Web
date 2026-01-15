<script lang="ts">
  import { page } from '$app/state';
  import { Spinner } from '$lib/components';
  import { Button } from '$lib/components/ui/button';
  import i18n from '$lib/i18n';
  import type { Wrapped } from '$lib/server/db/wrapped';
  import { cn } from '$lib/utils';
  import { ArrowRight } from '@lucide/svelte';
  import * as Carousel from '$lib/components/ui/carousel';
  import { fade, scale } from 'svelte/transition';
  import type { CarouselAPI } from '$lib/components/ui/carousel/context';
  import { Post } from '$lib/components/social';

  let hasWrapped = $derived(page.data.wrappedAvailable);
  let open = $state(false);
  let loading = $state(false);
  let wrapped = $state<Wrapped | null>(null);
  let currentStep = $state(0);
  let carouselCurrentIndex = $state(0);
  let carouselApi = $state<CarouselAPI>();

  $effect(() => {
    if (carouselApi) {
      carouselCurrentIndex = carouselApi.selectedScrollSnap() + 1;
      carouselApi.on('select', () => {
        carouselCurrentIndex = carouselApi!.selectedScrollSnap() + 1;
      });
    }
  });
  const steps = [
    {
      title: 'wrapped.tabs.mostWornItems',
    },
    {
      title: 'wrapped.tabs.mostLikedPost',
    },
  ];

  async function getWrapped() {
    const res = await fetch('/api/wardrobe/wrapped');
    if (res.ok) {
      const data = await res.json();
      wrapped = data.wrapped;
    }
    return null;
  }

  $effect(() => {
    if (open && !wrapped) {
      loading = true;
      getWrapped().finally(() => {
        loading = false;
      });
    }
  });

  $effect(() => {
    if (currentStep >= steps.length) {
      open = false;
      currentStep = 0;
    }
  });
</script>

{#if open}
  <div class="fixed inset-0 z-50 bg-background" transition:scale>
    <div class="relative size-full flex flex-col p-4">
      {#if loading}
        <div
          class="absolute top-1/2 left-1/2 -transition-x-1/2 -transition-y-1/2"
          transition:fade={{ duration: 300 }}
        >
          <Spinner class="size-8" />
        </div>
      {:else if wrapped}
        <div class="grow flex flex-col gap-4 w-full">
          <!-- Steps circles -->
          <div class="flex items-center justify-center">
            {#each Array(steps.length), index}
              <button
                onclick={() => {
                  if (index < currentStep) currentStep = index;
                }}
                class={cn(
                  'size-8 rounded-full font-mono text-center text-sm flex flex-col items-center justify-center transition-colors duration-500',
                  index === currentStep
                    ? 'bg-accent'
                    : index < currentStep
                      ? 'bg-primary text-accent'
                      : 'bg-transparent border-2 border-border text-primary'
                )}
                disabled={index >= currentStep}>{index + 1}</button
              >
              {#if index < steps.length - 1}
                <div class="relative h-1 bg-border flex-1 overflow-hidden">
                  <div
                    class="absolute h-full bg-primary transition-all duration-500"
                    style="width: {index < currentStep ? '100' : '0'}%;"
                  ></div>
                </div>
              {/if}
            {/each}
          </div>
          {#each steps as step, i}
            {#if i === currentStep}
              <h1 class="text-center text-xl font-medium">{i18n.t(step.title as any)}</h1>
              {#if i === 0}
                <div class="relative w-full flex flex-col">
                  <Carousel.Root
                    class="w-full grow h-full"
                    setApi={(emblaApi) => (carouselApi = emblaApi)}
                  >
                    <Carousel.Content>
                      {#each wrapped.mostWorn as item}
                        <Carousel.Item>
                          <!-- svelte-ignore a11y_missing_attribute -->
                          <img
                            src={item.imageUrl}
                            class="size-full object-center object-cover aspect-3/4 border border-border rounded-xl"
                          />
                        </Carousel.Item>
                      {/each}
                    </Carousel.Content>
                  </Carousel.Root>
                  {#if wrapped.mostWorn.length > 1}
                    <div class="absolute flex flex-row gap-2 bottom-4 left-1/2 -translate-x-1/2">
                      {#each Array(wrapped.mostWorn.length), i}
                        {@const active = i === carouselCurrentIndex - 1}
                        <!-- svelte-ignore a11y_consider_explicit_label -->
                        <button
                          class={cn(
                            'h-2 rounded-full duration-300 transition-all',
                            active ? 'bg-primary w-6' : 'bg-primary/50 w-2'
                          )}
                          onclick={() => {
                            if (carouselApi) {
                              carouselApi.scrollTo(i);
                            }
                          }}
                        ></button>
                      {/each}
                    </div>
                  {:else}
                    <p class="text-center text-base font-mono">
                      {i18n.t('wrapped.noWornItems')}
                    </p>
                  {/if}
                </div>
              {:else if i === 1}
                {#if wrapped.mostLikedPost}
                  <Post post={wrapped.mostLikedPost} />
                {:else}
                  <p class="text-center text-base font-mono">
                    {i18n.t('wrapped.noLikedPost')}
                  </p>
                {/if}
              {/if}
            {/if}
          {/each}
        </div>
        <Button class="flex flex-row gap-2" onclick={() => currentStep++}>
          <ArrowRight class="rtl:rotate-180" />
        </Button>
      {/if}
    </div>
  </div>
{/if}

{#if hasWrapped}
  <div class="p-2 w-full flex flex-col">
    <Button onclick={() => (open = true)}>
      {i18n.t('wrapped.cta')}
    </Button>
  </div>
{/if}
