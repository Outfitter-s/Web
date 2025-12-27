<script lang="ts">
  import type { User } from '$lib/types';
  import { cn } from '$lib/utils';
  import type { SvelteHTMLElements } from 'svelte/elements';

  interface Props {
    userId: User['id'];
  }

  let { userId, class: className, ...restProps }: Props & SvelteHTMLElements['img'] = $props();
  let classes = $derived(cn('rounded-[42%] size-6 bg-primary/50 overflow-hidden', className));
</script>

<img src="/assets/profile_pictures/{userId}.png" alt="" class={classes} {...restProps} />
