<script lang="ts">
  import { cn } from '$lib/utils';
  import type { PageProps } from './$types';

  const sections = ['items', 'outfits'] as const;
  type Section = (typeof sections)[number];

  let { data }: PageProps = $props();
  let outfits = $derived(data.outfits);
  let items = $derived(data.items);

  let activeSection = $state<Section>(sections[0]);

  const changeSection = (section: Section) => {
    activeSection = section;
  };
</script>

<div class="flex grow flex-col">
  <!-- Header -->
  <div class="flex shrink-0 flex-row flex-nowrap gap-4 overflow-x-scroll p-4 pb-0">
    <button
      onclick={() => changeSection('items')}
      class={cn(
        'border-border bg-card rounded-lg border px-4 py-1 font-mono transition-all',
        activeSection === 'items' && 'bg-primary text-primary-foreground border-primary'
      )}>Items</button
    >
    <button
      onclick={() => changeSection('outfits')}
      class={cn(
        'border-border bg-card rounded-lg border px-4 py-1 font-mono transition-all',
        activeSection === 'outfits' && 'bg-primary text-primary-foreground border-primary'
      )}>Outfits</button
    >
  </div>

  <!-- Content -->
  <div class="size-full grow overflow-x-hidden">
    <div
      class="grid grid-rows-1 transition-transform"
      style="grid-template-columns: repeat({sections.length}, 1fr); width: calc(100% * {sections.length}); transform: translateX(-{sections.indexOf(
        activeSection
      ) *
        (100 / sections.length)}%);"
    >
      {#each sections as section}
        <div
          class="grid gap-4 p-4"
          style="grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));"
        >
          {#if section === 'items'}
            {#each items as item}
              <a
                href="/app/wardrobe/item/{item.id}"
                class="border-border bg-card flex flex-col overflow-hidden rounded-lg border transition-transform hover:rotate-2"
              >
                <img
                  src={item.imageUrl}
                  class="aspect-square w-full object-cover object-center"
                  alt=""
                />
                <div class="flex flex-col p-2">
                  <div class="font-mono text-lg font-semibold">{item.name}</div>
                  <div class="text-muted-foreground text-sm">{item.description}</div>
                </div>
              </a>
            {/each}
          {:else if section === 'outfits'}
            {#each outfits as outfit}
              <div class="border-border bg-card flex flex-col gap-2 rounded-lg border p-4">
                <div class="font-mono text-lg font-semibold">{outfit.id}</div>
              </div>
            {/each}
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>
