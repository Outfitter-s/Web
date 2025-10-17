<script lang="ts">
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  const { items } = data;
  $inspect(items);
</script>

<a href="/app/wardrobe/add_item">Add item</a>
<a href="/app/wardrobe/outfits">Outfits</a>
