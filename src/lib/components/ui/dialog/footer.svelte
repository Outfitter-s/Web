<script lang="ts">
  import { cn, type WithElementRef } from '$lib/utils';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
  bind:this={ref}
  class={cn('mt-auto flex flex-row justify-end gap-2', className)}
  {...restProps}
>
  {@render children?.()}
</div>
