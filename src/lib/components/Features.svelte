<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';

  export let collapseDelay = 5000;
  export let ltr = false;
  export let linePosition: 'left' | 'right' | 'top' | 'bottom' = 'left';
  export let data: Array<{
    id: number;
    title: string;
    content: string;
    image: string;
    icon?: any;
  }> = [];

  let currentIndex = writable(0);
  let carouselRef: HTMLUListElement;

  const scrollToIndex = (index: number) => {
    if (carouselRef) {
      const cards = carouselRef.querySelectorAll('.card_code');
      const card = cards[index] as HTMLElement;

      if (card) {
        const cardRect = card.getBoundingClientRect();
        const carouselRect = carouselRef.getBoundingClientRect();
        const offset =
          cardRect.left - carouselRect.left - (carouselRect.width - cardRect.width) / 2;

        carouselRef.scrollTo({
          left: carouselRef.scrollLeft + offset,
          behavior: 'smooth',
        });
      }
    }
  };

  onMount(() => {
    let timmer = setTimeout(() => {
      currentIndex.set(0);
    }, 100);
    return () => clearTimeout(timmer);
  });

  onMount(() => {
    let autoScrollTimer: NodeJS.Timeout;
    const handleAutoScroll = () => {
      currentIndex.update((prevIndex) =>
        prevIndex !== undefined ? (prevIndex + 1) % data.length : 0
      );
      scrollToIndex($currentIndex);
    };

    autoScrollTimer = setInterval(handleAutoScroll, collapseDelay);

    return () => clearInterval(autoScrollTimer);
  });
</script>

<section id="features">
  <div class="container px-4 sm:px-6">
    <div class="mx-auto max-w-6xl">
      <div class="mx-auto my-12 grid h-full items-center gap-6 lg:grid-cols-2 lg:gap-10">
        <!-- Desktop: Liste des features -->
        <div
          class="order-1 hidden lg:order-0 lg:flex {ltr
            ? 'lg:order-2 lg:justify-end'
            : 'justify-start'}"
        >
          <div>
            {#each data as item, index}
              <div class="relative mb-8 flex items-center last:mb-0">
                {#if linePosition === 'left' || linePosition === 'right'}
                  <div
                    class="absolute inset-y-0 h-full w-0.5 overflow-hidden rounded-lg bg-neutral-300/50 dark:bg-neutral-300/30 {linePosition ===
                    'right'
                      ? 'left-auto right-0'
                      : 'left-0 right-auto'}"
                  >
                    <div
                      class="absolute left-0 top-0 w-full {$currentIndex === index
                        ? 'h-full'
                        : 'h-0'} origin-top bg-primary transition-all ease-linear dark:bg-white"
                      style="transition-duration: {$currentIndex === index
                        ? `${collapseDelay}ms`
                        : '0s'};"
                    ></div>
                  </div>
                {/if}

                <div
                  class="item-box mx-2 flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 sm:mx-6"
                >
                  <svelte:component this={item.icon} class="size-6 text-primary" />
                </div>
                <div class="space-y-2">
                  <h3 class="text-lg font-bold lg:text-2xl">{item.title}</h3>
                  <div class="w-96 text-[16px] text-muted-foreground">
                    {item.content}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Image (Desktop et Mobile) -->
        <div class="min-h-50 h-80 w-full sm:h-96 lg:h-87.5 {ltr && 'lg:order-1'}">
          {#if data[$currentIndex] && data[$currentIndex].image}
            <img
              src={data[$currentIndex].image}
              alt="feature"
              class="aspect-auto size-full rounded-xl border border-neutral-300/50 object-cover p-1 shadow-lg"
            />
          {:else}
            <div
              class="aspect-auto size-full rounded-xl border border-neutral-300/50 bg-gray-200 p-1"
            ></div>
          {/if}
        </div>

        <!-- Mobile: Barre de progression -->
        <div class="relative -mb-8 pb-0.5 md:hidden">
          {#each data as _, index}
            <div
              class="absolute inset-x-0 top-0 h-0.5 w-full overflow-hidden rounded-lg bg-neutral-300/50 dark:bg-neutral-300/30"
            >
              <div
                class="absolute left-0 top-0 h-full {$currentIndex === index
                  ? 'w-full'
                  : 'w-0'} origin-left bg-primary transition-all ease-linear dark:bg-white"
                style="transition-duration: {$currentIndex === index
                  ? `${collapseDelay}ms`
                  : '0s'};"
              ></div>
            </div>
          {/each}
        </div>

        <!-- Mobile: Carousel des features -->
        <ul
          bind:this={carouselRef}
          class="relative flex h-full snap-x snap-mandatory flex-nowrap overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden"
        >
          {#each data as item, index}
            <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
            <li
              class="card_code relative mr-6 grid h-full max-w-[85vw] shrink-0 items-start justify-start gap-3 pl-2 last:mr-0 sm:mr-8 sm:max-w-md"
              on:click={() => currentIndex.set(index)}
              role="button"
              tabindex="0"
              on:keydown={(e) => e.key === 'Enter' && currentIndex.set(index)}
              style="scroll-snap-align: center;"
            >
              <div
                class="flex size-10 items-center justify-center rounded-full bg-primary/10 sm:size-12"
              >
                <svelte:component this={item.icon} class="size-5 text-primary sm:size-6" />
              </div>
              <h2 class="text-lg font-bold sm:text-xl">{item.title}</h2>
              <p class="max-w-sm text-balance text-sm text-muted-foreground">
                {item.content}
              </p>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  </div>
</section>

<style>
  .card_code {
    transition: all 0.3s ease;
  }
  .item-box {
    width: 3rem;
    height: 3rem;
  }
</style>
