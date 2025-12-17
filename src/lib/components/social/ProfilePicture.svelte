<script lang="ts">
  import type { User } from '$lib/types';
  import { cn } from '$lib/utils';
  import { UserIcon } from '@lucide/svelte';
  import type { SvelteHTMLElements } from 'svelte/elements';

  interface Props {
    userId: User['id'];
  }

  let { userId, class: className, ...restProps }: Props & SvelteHTMLElements['img'] = $props();
  let hasError = $state(false);
  let classes = $derived(cn('rounded-full size-6 overflow-hidden border border-border', className));

  function onError(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    hasError = true;
  }
</script>

{#if hasError}
  <UserIcon class={classes} />
{:else}
  <img
    src="/assets/profile_pictures/{userId}.png"
    alt=""
    class={classes}
    onerror={onError}
    {...restProps}
  />
{/if}
