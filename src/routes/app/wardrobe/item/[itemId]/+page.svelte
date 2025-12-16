<script lang="ts">
  import { capitalize, DateUtils } from '$lib/utils';
  import { Calendar, Palette, Shirt, Pencil } from '@lucide/svelte';
  import ColorDot from '$lib/components/colorDot.svelte';
  import { Button } from '$lib/components/ui/button';
  import { NavBack, SEO } from '$lib/components';
  import { resolve } from '$app/paths';
  import i18n from '$lib/i18n';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  let item = $derived(data.item);
</script>

<SEO title="seo.wardrobe.item.title" description="seo.wardrobe.item.description" />

<NavBack title="{item.name} - {i18n.t('seo.wardrobe.item.title')}" />
<div class="lg:p-2 max-lg:pt-2 max-lg:p-4 lg:pl-4">
  <div class="bg-card relative border-border flex flex-col rounded-lg border lg:flex-row">
    <!-- Image -->
    <div
      class="-ml-2 border border-border -mt-2 rounded-lg overflow-hidden bg-primary lg:-mb-2 max-lg:-mr-2 max-h-[70vh] lg:max-h-200 aspect-10/14 lg:aspect-square inline-block"
    >
      <img src={item.imageUrl} alt={item.name} class="size-full object-cover object-center" />
    </div>

    <!-- Details -->
    <div class="flex w-full flex-col gap-4 p-2 lg:w-1/2 lg:p-4">
      <div class="flex items-start justify-between">
        <h1 class="font-sans text-2xl font-bold">{item.name}</h1>
        <div class="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            href={resolve('/app/wardrobe/item/[itemId]/edit', { itemId: item.id })}
          >
            <Pencil class="size-4" />
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
