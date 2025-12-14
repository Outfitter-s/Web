<script lang="ts">
  import { SEO } from '$lib/components';
  import Swiper from './Swiper.svelte';
  import Timeline from './Timeline.svelte';
  import type { Outfit } from '$lib/types';
  import { DateUtils } from '$lib/utils';
  import { page } from '$app/state';

  let chosenOutfit = $derived(
    (page.data.outfits as Outfit[]).find((o) => DateUtils.isToday(o.createdAt)) ?? null
  );
</script>

<SEO title="seo.homePage.title" description="seo.homePage.description" />

<!-- If the user has not chosen an outfit for today, make it choose on before showing the timeline -->
{#if !chosenOutfit}
  <Swiper />
{:else}
  <p>
    You're wearing outfit id {chosenOutfit.id} today!
  </p>
  <Timeline />
{/if}
