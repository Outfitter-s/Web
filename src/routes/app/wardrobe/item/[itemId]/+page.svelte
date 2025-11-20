<script lang="ts">
  import { locale } from '$lib/i18n';
  import { page } from '$app/state';
  import type { ClothingItem } from '$lib/types';
  import { capitalize } from '$lib/utils';
  import { DateFormatter } from '@internationalized/date';
  import { Calendar, Palette, Shirt, Pencil } from '@lucide/svelte';
  import ColorDot from '$lib/components/colorDot.svelte';
  import { Button } from '$lib/components/ui/button';

  let itemId = $derived<string>(page.params.itemId as string);
  let items = $derived<ClothingItem[]>(page.data.items);
  let item = $derived(items.find((it) => it.id === itemId));

  $effect(() => {
    if (!item) {
      throw new Error('Item not found');
    }
  });

  const formatDate = (date: Date) => {
    return new DateFormatter(locale, { day: '2-digit', month: 'short' }).format(date);
  };
</script>

{#if item}
  <div class="p-2">
    <div class="bg-card border-border flex flex-col overflow-hidden rounded-lg border lg:flex-row">
      <!-- Image -->
      <img
        src={item.imageUrl}
        class="aspect-square max-h-[800px] w-full object-cover object-center lg:w-1/2"
        alt=""
      />

      <!-- Details -->
      <div class="flex w-full flex-col gap-4 p-2 lg:w-1/2 lg:p-4">
        <div class="flex items-start justify-between">
          <h1 class="font-sans text-2xl font-bold">{item.name}</h1>
          <Button variant="outline" size="icon" href="/app/wardrobe/item/{itemId}/edit">
            <Pencil class="size-4" />
          </Button>
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
              <div>{formatDate(item.lastWornAt)}</div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
