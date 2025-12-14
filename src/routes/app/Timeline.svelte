<script lang="ts">
  import { onMount } from 'svelte';
  // import { DateUtils } from '$lib/utils';

  let scrollContainer = $state<HTMLDivElement>();

  const outfits: { imageUrl: string; date: Date }[] = [
    { imageUrl: 'https://placehold.co/400x400', date: new Date('2025-10-01') },
    { imageUrl: 'https://placehold.co/400x400', date: new Date('2025-10-02') },
    { imageUrl: 'https://placehold.co/400x400', date: new Date('2025-10-03') },
    { imageUrl: 'https://placehold.co/400x400', date: new Date('2025-10-04') },
    { imageUrl: 'https://placehold.co/400x400', date: new Date('2025-10-05') },
    { imageUrl: 'https://placehold.co/400x400', date: new Date('2025-10-06') },
    { imageUrl: 'https://placehold.co/400x400', date: new Date('2025-10-07') },
    { imageUrl: 'https://placehold.co/400x400', date: new Date('2025-10-08') },
    { imageUrl: 'https://placehold.co/400x400', date: new Date('2025-10-09') },
  ]; // This represents the last outfits/2 outfits, today, and the next outfits/2 outfits

  onMount(() => {
    if (scrollContainer) {
      const middleIndex = Math.floor(outfits.length / 2);
      const middleElement = scrollContainer.children[middleIndex] as HTMLElement;
      if (middleElement) {
        const scrollLeft =
          middleElement.offsetLeft -
          scrollContainer.offsetLeft -
          scrollContainer.offsetWidth / 2 +
          middleElement.offsetWidth / 2;
        scrollContainer.scrollTo({ left: scrollLeft, behavior: 'auto' });
      }
    }
  });
</script>

<!-- <section class="flex h-full w-full grow flex-col items-center justify-center p-4 text-center">
  <div
    bind:this={scrollContainer}
    class="no-scrollbar grid h-fit max-h-[400px] w-full snap-x snap-mandatory snap-always overflow-x-auto"
    style="grid-template-columns: repeat({outfits.length}, 1fr);"
  >
    {#each outfits as outfit}
      <div class="relative flex w-[80dvw] snap-center flex-col items-center gap-2 px-2 pb-10">
        <img
          src={outfit.imageUrl}
          alt="Outfit Image"
          class="aspect-square w-full rounded-md object-cover shadow-md"
        />
        <div class="absolute right-0 bottom-0 left-0 flex flex-row items-center">
          <div class="border-border grow border-b-2"></div>
          <div class="text-primary bg-border shrink-0 rounded-full p-2 font-mono text-sm">
            {DateUtils.formatDate(outfit.date)}
          </div>
          <div class="border-border grow border-b-2"></div>
        </div>
      </div>
    {/each}
  </div>
</section> -->
