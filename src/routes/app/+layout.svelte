<script lang="ts">
  import type { LayoutProps } from './$types';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { DateUtils } from '$lib/utils';
  import NoOutfitBanner from '$lib/components/Reminder/NoOutfitBanner.svelte';

  let { children }: LayoutProps = $props();

  // Banner logic moved to `NoOutfitBanner` component
</script>

<div class="flex grow flex-col">
  <NoOutfitBanner user={$page.data.user} outfits={$page.data.outfits} />

  {@render children()}
</div>
