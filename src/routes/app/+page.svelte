<script lang="ts">
  import { SEO } from '$lib/components';
  import Swiper from './Swiper.svelte';
  import Timeline from './Timeline.svelte';
  import i18n from '$lib/i18n';
  import type { SwiperCard } from '$lib/types';

  let chosenOutfit = $state<SwiperCard | null>(null);
</script>

<SEO title={i18n.t('seo.homePage.title')} />

<!-- If the user has not chosen an outfit for today, make it choose on before showing the timeline -->
{#if !chosenOutfit}
  <Swiper bind:chosenOutfit />
{:else}
  <Timeline />
{/if}
