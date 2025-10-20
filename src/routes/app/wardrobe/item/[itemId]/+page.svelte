<script lang="ts">
  import { locale } from '$lib/i18n';
  import { page } from '$app/state';
  import type { ClothingItem } from '$lib/types';
  import { capitalize } from '$lib/utils';
  import { DateFormatter } from '@internationalized/date';
  import { Calendar, Palette, Shirt } from '@lucide/svelte';

  let itemId = $derived<string>(page.params.itemId as string);
  let items = $derived<ClothingItem[]>(page.data.items);
  let item = $derived(items.find((it) => it.id === itemId));

  $effect(() => {
    if (!item) {
      throw new Error('Item not found');
    }
  });

  const colorMap: Record<ClothingItem['color'], string> = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    black: 'bg-black',
    white: 'bg-white',
    gray: 'bg-gray-500',
    brown: 'bg-yellow-800',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    orange: 'bg-orange-500',
  };

  const formatDate = (date: Date) => {
    return new DateFormatter(locale, { day: '2-digit', month: 'short' }).format(date);
  };
</script>

{#snippet colorDot(color: ClothingItem['color'])}
  <div class={'size-4 rounded-full ' + (colorMap[color] || 'bg-gray-500')}></div>
{/snippet}

{#if item}
  <div class="flex grow flex-col p-2 lg:flex-row">
    <!-- Image -->
    <img
      src={item.imageUrl}
      class="aspect-square max-h-[800px] w-full rounded-lg object-cover object-center lg:w-1/2"
      alt=""
    />

    <!-- Details -->
    <div class="flex w-1/2 flex-col gap-4 max-lg:pt-4 lg:pl-4">
      <h1 class="font-sans text-2xl font-bold">{item.name}</h1>
      <p class="font-mono text-base font-normal wrap-normal">{item.description}</p>

      <div class="grid w-full grid-cols-3 grid-rows-1">
        <div class="flex flex-col gap-1">
          <div class="text-lg font-medium">
            <Palette class="mr-2 mb-1 inline size-5" />
            Color
          </div>
          <div class="flex flex-row items-center gap-2">
            {@render colorDot(item.color)}
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
{/if}
