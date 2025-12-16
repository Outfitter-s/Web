<script lang="ts">
  import i18n from '$lib/i18n';
  import { DateUtils } from '$lib/utils';
  import { NavBack, SEO } from '$lib/components';
  import { resolve } from '$app/paths';
  import { OutfitItemCard } from '$lib/components/wardrobe';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  let outfit = $derived(data.outfit);
</script>

<SEO title="seo.wardrobe.item.title" description="seo.wardrobe.item.description" />

<NavBack
  title={i18n.t('wardrobe.outfitDetails.lastWornOn', {
    date: DateUtils.formatDate(outfit.createdAt),
  })}
/>
<div class="p-2 flex flex-col gap-4">
  <div
    class="grid gap-x-6 gap-y-4 px-2"
    style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));"
  >
    {#each outfit.items as item}
      <OutfitItemCard
        element="a"
        {item}
        href={resolve('/app/wardrobe/item/[itemId]', { itemId: item.id })}
      />
    {/each}
  </div>
</div>
