<script lang="ts">
  import * as InputGroup from '$lib/components/ui/input-group';
  import i18n from '$lib/i18n';
  import { Search, User as UserIcon, Upload } from '@lucide/svelte';
  import type { PageProps } from './$types';
  import type { Publication, User } from '$lib/types';
  import { logger } from '$lib/utils';
  import { Toaster } from '$lib/components/Toast/toast';
  import { flip } from 'svelte/animate';
  import { slide } from 'svelte/transition';
  import { ProfilePicture } from '$lib/components';
  import { resolve } from '$app/paths';
  import { Button } from '$lib/components/ui/button/index.js';
  import { publierOpen } from '$lib/components/routes/app/feed';
  import * as Card from '$lib/components/ui/card/index.js';

  let { data }: PageProps = $props();

  const publications: Publication[] = $derived<Publication[]>(data.publications);
  let searchResults = $state<User[]>([]);
  let user: User = $derived(data.user);

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

{#snippet card(publication: Publication)}
  <Card.Root class="w-full h-full p-4 flex flex-col gap-2 border rounded-xl">
    <Card.Header class="flex items-center space-between -mx-6 mb-2">
      <ProfilePicture userId={user.id} class="scale-120" />
      <p class="ml-1">{user.username}</p>
    </Card.Header>
    <Card.Content class="-mx-6">
      <img src={publication.imageUrl} alt="post" class="rounded" />
    </Card.Content>
    <Card.Description>
      {publication.description}
    </Card.Description>
  </Card.Root>
{/snippet}

<div class="mx-auto flex w-full max-w-250 flex-col gap-4 items-start">
  {#if searchResults.length > 0}
    <!-- svelte-ignore a11y_consider_explicit_label -->
    <button class="fixed z-0 appearance-none inset-0" onclick={() => (searchResults = [])}></button>
  {/if}
  <div class="sticky top-0 left-0 right-0 w-full bg-card z-20">
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
  </div>

  <div class="w-full relative scroll-smooth overflow-y-auto">
    <div class="p-4 flex flex-col gap-4 z-0">
      {#each publications as publication}
        {@render card(publication)}
      {/each}
    </div>
  </div>

  <Button
    size="lg"
    aria-label="create a pulication"
    class="fixed bottom-16 right-4 z-10"
    onclick={() => ($publierOpen = !$publierOpen)}
  >
    <Upload class="scale-170" />
  </Button>
</div>
