<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { LayoutProps } from './$types';
  import Globals from '$lib/globals.svelte';
  import { LogOut } from '@lucide/svelte';
  import { resolve } from '$app/paths';

  let { children }: LayoutProps = $props();

  onMount(() => {
    Globals.navBack.trailing = [
      {
        icon: LogOut,
        href: resolve('/auth/log-out'),
      },
    ];
  });

  onDestroy(() => {
    Globals.navBack.trailing = [];
  });
</script>

{@render children()}
