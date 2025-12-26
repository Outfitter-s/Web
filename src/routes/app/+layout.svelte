<script lang="ts">
  import type { LayoutProps } from './$types';

  let { children }: LayoutProps = $props();
</script>

<div class="max-w-250 w-full mx-auto grow flex flex-col">
  {@render children()}
</div>
