<script lang="ts">
  import type { SvelteHTMLElements } from 'svelte/elements';
  let { children, ...restProps }: SvelteHTMLElements['div'] = $props();
</script>

<div class="flex flex-col space-y-4" {...restProps}>
  {@render children?.()}
</div>
