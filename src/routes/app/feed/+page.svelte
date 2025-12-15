<script lang="ts">
  import * as InputGroup from '$lib/components/ui/input-group';
  import i18n from '$lib/i18n';
  import { Search, User as UserIcon } from '@lucide/svelte';
  import type { PageProps } from './$types';
  import type { User } from '$lib/types';
  import { logger } from '$lib/utils';
  import { Toaster } from '$lib/components/Toast/toast';
  import { flip } from 'svelte/animate';
  import { slide } from 'svelte/transition';

  let { data }: PageProps = $props();
  let searchResults = $state<User[]>([]);

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
      Toaster.error((msg as any) || 'errors.social.searchFailed');
    }
  }
</script>

<div class="mx-auto flex w-full max-w-250 flex-col gap-4 items-start">
  {#if searchResults.length > 0}
    <!-- svelte-ignore a11y_consider_explicit_label -->
    <button class="fixed z-9 appearance-none inset-0" onclick={() => (searchResults = [])}></button>
  {/if}
  <div class="sticky top-0 left-0 right-0 w-full">
    <div class="relative w-full p-2">
      <InputGroup.Root class="z-10">
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
          class="absolute left-2 right-2 top-full mt-1 rounded-lg overflow-hidden bg-card border border-border z-10 flex flex-col"
          transition:slide={{ axis: 'y', duration: 300 }}
        >
          {#each searchResults as user (user.id)}
            <a
              href="/app/@{user.username}"
              class="px-4 py-2 cursor-pointer flex flex-row gap-4"
              animate:flip={{ duration: 300 }}
            >
              <div class="size-6 bg-card rounded-full border border-border overflow-hidden">
                <UserIcon class="size-full" />
              </div>
              {user.username}
            </a>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- TODO: add feed posts -->
</div>
