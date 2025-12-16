<script lang="ts">
  import type { LayoutProps } from './$types';

  let { children }: LayoutProps = $props();
</script>

<div class="mx-auto max-w-[800px] w-full p-4 md:p-8">
  {@render children()}
</div>
