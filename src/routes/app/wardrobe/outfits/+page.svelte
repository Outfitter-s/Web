<script lang="ts">
  import MixAndMatch from '$lib/components/routes/outfits/MixAndMatch.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<MixAndMatch />
