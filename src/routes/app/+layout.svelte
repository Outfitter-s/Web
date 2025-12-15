<script lang="ts">
  import type { LayoutProps } from './$types';
  import NoOutfitBanner from './NoOutfitBanner.svelte';

  let { children }: LayoutProps = $props();
</script>

<div class="flex grow flex-col">
  <NoOutfitBanner />

  {@render children()}
</div>
