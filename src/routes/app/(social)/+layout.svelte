<script lang="ts">
  import * as InputGroup from '$lib/components/ui/input-group';
  import i18n from '$lib/i18n';
  import { Search, Plus } from '@lucide/svelte';
  import type { User } from '$lib/types';
  import { logger } from '$lib/utils';
  import { Toaster } from '$lib/components/Toast/toast';
  import { flip } from 'svelte/animate';
  import { slide } from 'svelte/transition';
  import { resolve } from '$app/paths';
  import Publier from './publier.svelte';
  import { ProfilePicture } from '$lib/components/social';
  import { onDestroy, onMount } from 'svelte';
  import Globals from '$lib/globals.svelte';
  import Backdrop from '$lib/components/ui/dialog/backdrop.svelte';
  import type { LayoutProps } from './$types';
  import { afterNavigate } from '$app/navigation';

  let { children }: LayoutProps = $props();

  onDestroy(() => {
    Globals.navBack.trailing = [];
  });

  onMount(() => {
    Globals.navBack.trailing = [
      {
        icon: Search,
        onclick: () => (searchOpen = !searchOpen),
      },
      {
        icon: Plus,
        onclick: () => (publierOpen = !publierOpen),
      },
    ];
  });

  afterNavigate(() => {
    searchOpen = false;
    searchResults = [];
  });

  let searchResults = $state<User[]>([]);
  let publierOpen = $state(false);
  let searchOpen = $state(false);

  async function searchUser() {
    const searchQuery = (document.querySelector('input') as HTMLInputElement).value;
    if (searchQuery.length === 0) {
      searchResults = [];
      return;
    }
    try {
      const res = await fetch(`/api/social/search?q=${encodeURIComponent(searchQuery)}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      searchResults = result.results;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error('Error searching users:', msg);
      searchResults = [];
      Toaster.error(msg as any);
    }
  }
</script>

<Publier bind:open={publierOpen} />

{#if searchOpen}
  <!-- Dismiss backdrop -->
  <!-- svelte-ignore a11y_consider_explicit_label -->
  <Backdrop bind:open={searchOpen}></Backdrop>
  <div class="fixed z-50 top-6 left-4 right-4 items-center gap-2 flex flex-col">
    <!-- Search bar -->
    <InputGroup.Root class="z-10 bg-input!">
      <InputGroup.Input
        onkeyup={searchUser}
        placeholder={i18n.t('social.feed.search.placeholder')}
      />
      <InputGroup.Addon>
        <Search />
      </InputGroup.Addon>
    </InputGroup.Root>
    {#if searchResults.length > 0}
      <div
        class="rounded-lg overflow-hidden bg-card w-full border border-border flex flex-col"
        transition:slide={{ axis: 'y', duration: 300 }}
      >
        {#each searchResults as user (user.id)}
          <a
            href={resolve('/app/[username]', { username: `@${user.username}` })}
            class="px-4 py-2 cursor-pointer flex flex-row gap-4"
            animate:flip={{ duration: 300 }}
          >
            <div class="size-6 bg-card rounded-full border border-border overflow-hidden">
              <ProfilePicture userId={user.id} class="size-full" />
            </div>
            {user.username}
          </a>
        {/each}
      </div>
    {/if}
  </div>
{/if}

{@render children()}
