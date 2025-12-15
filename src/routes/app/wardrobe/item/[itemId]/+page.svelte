<script lang="ts">
  import { page } from '$app/state';
  import type { ClothingItem } from '$lib/types';
  import { capitalize, DateUtils } from '$lib/utils';
  import { Calendar, Palette, Shirt, Pencil, ArrowLeftIcon } from '@lucide/svelte';
  import ColorDot from '$lib/components/colorDot.svelte';
  import { Button } from '$lib/components/ui/button';
  import { SEO } from '$lib/components';
  import { Backdrop } from '$lib/components/ui/dialog';
  import { resolve } from '$app/paths';

  let itemId = $derived<string>(page.params.itemId as string);
  let items = $derived<ClothingItem[]>(page.data.items);
  let item = $derived(items.find((it) => it.id === itemId));

  $effect(() => {
    if (!item) {
      throw new Error('Item not found');
    }
  });
</script>

<SEO title="seo.wardrobe.item.title" description="seo.wardrobe.item.description" />

{#if item}
  <div class="p-4">
    <div class="bg-card relative border-border flex flex-col rounded-lg border lg:flex-row">
      <!-- Image -->
      <div
        class="-ml-2 bg-card -mt-2 lg:-mb-2 max-lg:-mr-2 max-h-[70vh] lg:max-h-200 aspect-10/14 lg:aspect-square inline-block"
      >
        <img
          src={item.imageUrl}
          alt={item.name}
          class="size-full object-cover object-center rounded-lg"
        />
      </div>

      <!-- Details -->
      <div class="flex w-full flex-col gap-4 p-2 lg:w-1/2 lg:p-4">
        <div class="flex items-start justify-between">
          <h1 class="font-sans text-2xl font-bold">{item.name}</h1>
          <div class="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              href={resolve('/app/wardrobe/item/{itemId}/edit')}
            >
              <Pencil class="size-4" />
            </Button>
            <Button variant="outline" size="icon" href={resolve('/app/wardrobe/')}>
              <ArrowLeftIcon class="size-4" />
            </Button>
          </div>
        </div>

        <p class="font-mono text-base font-normal wrap-normal">{item.description}</p>

        <div
          class="grid w-full grid-rows-1"
          style="grid-template-columns: repeat({item.lastWornAt ? 3 : 2}, minmax(0, 1fr));"
        >
          <div class="flex flex-col gap-1">
            <div class="text-lg font-medium">
              <Palette class="mr-2 mb-1 inline size-5" />
              Color
            </div>
            <div class="flex flex-row items-center gap-2">
              <ColorDot color={item.color} />
              <span>{capitalize(item.color)}</span>
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <div class="text-lg font-medium">
              <Shirt class="mr-2 mb-1 inline size-5" />
              Type
            </div>
            <div>{capitalize(item.type)}</div>
          </div>

          {#if item.lastWornAt}
            <div class="flex flex-col gap-1">
              <div class="text-lg font-medium">
                <Calendar class="mr-2 mb-1 inline size-5" />
                Last Worn
              </div>
              <div>{DateUtils.formatDate(item.lastWornAt)}</div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
