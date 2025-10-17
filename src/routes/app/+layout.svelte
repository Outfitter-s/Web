<script lang="ts">
  import type { LayoutProps } from './$types';

  let { children }: LayoutProps = $props();
</script>

<div class="flex grow flex-col">
  {@render children()}
</div>
