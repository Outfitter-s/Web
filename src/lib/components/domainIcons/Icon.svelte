<script lang="ts">
  import type { SvelteHTMLElements } from 'svelte/elements';

  let { children, ...restProps }: SvelteHTMLElements['svg'] = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  {...restProps}
>
  {@render children?.()}
</svg>
