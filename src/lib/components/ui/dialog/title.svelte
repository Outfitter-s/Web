<script lang="ts">
  import { cn } from '$lib/utils';
  import type { SvelteHTMLElements } from 'svelte/elements';

  const { children, class: className, ...props }: SvelteHTMLElements['h2'] = $props();
</script>

<h2 class={cn('text-lg leading-none font-semibold', className)} {...props}>
  {@render children?.()}
</h2>
