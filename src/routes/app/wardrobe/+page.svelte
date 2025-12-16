<script lang="ts">
  import { cn } from '$lib/utils';
  import * as Empty from '$lib/components/ui/empty';
  import { Button } from '$lib/components/ui/button';
  import { Shirt } from '@lucide/svelte';
  import { itemOpen } from '$lib/components/routes/app/nav';
  import i18n from '$lib/i18n';
  import { page } from '$app/state';
  import { OutfitItemCard, SEO } from '$lib/components';
  import OutfitCard from '$lib/components/OutfitCard.svelte';
  import { resolve } from '$app/paths';

  const sections = ['items', 'outfits'] as const;
  type Section = (typeof sections)[number];

  let activeSection = $state<Section>(sections[0]);

  const changeSection = (section: Section) => {
    activeSection = section;
  };
</script>

<SEO title="seo.wardrobe.title" description="seo.wardrobe.description" />

<div class="flex grow flex-col">
  <!-- Header -->
  <div class="flex shrink-0 flex-row flex-nowrap gap-4 p-2 pb-0">
    <button
      onclick={() => changeSection('items')}
      class={cn(
        'border-border bg-card rounded-lg border px-4 py-1 font-mono transition-all',
        activeSection === 'items' && 'bg-primary text-primary-foreground border-primary'
      )}>{i18n.t('wardrobe.itemList.items.title')}</button
    >
    <button
      onclick={() => changeSection('outfits')}
      class={cn(
        'border-border bg-card rounded-lg border px-4 py-1 font-mono transition-all',
        activeSection === 'outfits' && 'bg-primary text-primary-foreground border-primary'
      )}>{i18n.t('wardrobe.itemList.outfits.title')}</button
    >
  </div>

  <!-- Content -->
  <div class="size-full grow">
    {#if activeSection === 'items'}
      {#if page.data.items.length > 0}
        <div
          class="grid gap-x-6 gap-y-4 p-4"
          style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));"
        >
          {#each page.data.items as item}
            <OutfitItemCard
              element="a"
              {item}
              href={resolve('/app/wardrobe/item/[itemId]', { itemId: item.id })}
            />
          {/each}
        </div>
      {:else}
        <Empty.Root>
          <Empty.Header>
            <Empty.Media variant="icon">
              <Shirt />
            </Empty.Media>
            <Empty.Title>{i18n.t('wardrobe.itemList.items.empty.title')}</Empty.Title>
            <Empty.Description>
              {i18n.t('wardrobe.itemList.items.empty.description')}
            </Empty.Description>
          </Empty.Header>
          <Empty.Content>
            <Button onclick={() => ($itemOpen = true)}
              >{i18n.t('wardrobe.itemList.items.empty.createButton')}</Button
            >
          </Empty.Content>
        </Empty.Root>
      {/if}
    {:else if activeSection === 'outfits'}
      {#if page.data.items.length > 0}
        <div
          class="grid gap-8 p-2 h-full overflow-hidden"
          style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));"
        >
          {#each page.data.outfits as outfit}
            <OutfitCard
              {outfit}
              href={resolve('/app/wardrobe/outfit/[outfitId]', { outfitId: outfit.id })}
            />
          {/each}
        </div>
      {:else}
        <Empty.Root>
          <Empty.Header>
            <Empty.Media variant="icon">
              <Shirt />
            </Empty.Media>
            <Empty.Title>{i18n.t('wardrobe.itemList.outfits.empty.title')}</Empty.Title>
            <Empty.Description>
              {i18n.t('wardrobe.itemList.outfits.empty.description')}
            </Empty.Description>
          </Empty.Header>
          <Empty.Content>
            <Button href={resolve('/app')}
              >{i18n.t('wardrobe.itemList.outfits.empty.createButton')}</Button
            >
          </Empty.Content>
        </Empty.Root>
      {/if}
    {/if}
  </div>
</div>
