<script lang="ts">
  import { cn } from '$lib/utils';
  import type { SvelteHTMLElements } from 'svelte/elements';

  const { children, class: className, ...props }: SvelteHTMLElements['p'] = $props();
</script>

<p class={cn('text-muted-foreground text-sm', className)} {...props}>
  {@render children?.()}
</p>
