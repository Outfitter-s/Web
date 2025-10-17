<script lang="ts">
  import { Button } from '$lib/components/ui/button';

  let { children, ...restProps } = $props();
</script>

<Button type="button" variant="outline" {...restProps}>{@render children?.()}</Button>
