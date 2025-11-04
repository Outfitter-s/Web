<script lang="ts">
  import { SEO } from '$lib/components';
  import Swiper from '$lib/components/routes/app/Swiper.svelte';
  import Timeline from '$lib/components/routes/app/Timeline.svelte';
  import { t } from '$lib/i18n';
  import type { SwiperCard } from '$lib/types';

  let chosenOutfit = $state<SwiperCard | null>(null);
</script>

<SEO title={$t('seo.homePage.title')} />

<!-- If the user has not chosen an outfit for today, make it choose on before showing the timeline -->
{#if !chosenOutfit}
  <Swiper bind:chosenOutfit />
{:else}
  <Timeline />
{/if}
