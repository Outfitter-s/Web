<script lang="ts">
  import * as InputGroup from '$lib/components/ui/input-group';
  import i18n from '$lib/i18n';
  import { Search, Plus } from '@lucide/svelte';
  import type { PageProps } from './$types';
  import type { Publication, User } from '$lib/types';
  import { logger } from '$lib/utils';
  import { Toaster } from '$lib/components/Toast/toast';
  import { flip } from 'svelte/animate';
  import { slide } from 'svelte/transition';
  import { ProfilePicture, SEO } from '$lib/components';
  import { resolve } from '$app/paths';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import Publier from './publier.svelte';

  let { data }: PageProps = $props();

  const publications = $derived<Publication[]>(data.publications);
  let searchResults = $state<User[]>([]);
  let user = $derived<User>(data.user);
  let publierOpen = $state(false);

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

  function onPostImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/1255/image-not-found.svg';
  }
</script>

<Publier bind:open={publierOpen} />
<SEO title="seo.social.feed.title" description="seo.social.feed.description" />

{#snippet card(publication: Publication)}
  <div class="flex flex-col w-full gap-2">
    <a
      href={resolve('/app/[username]', { username: `@${publication.user.username}` })}
      class="flex flex-row items-center gap-2"
    >
      <ProfilePicture userId={publication.user.id} class="scale-120" />
      <p class="ml-1">{publication.user.username}</p>
    </a>
    <a class="w-full" href={resolve('/app/feed/[postId]', { postId: publication.id })}>
      <!-- svelte-ignore a11y_missing_attribute -->
      <img src={publication.imageUrl} class="rounded w-full" onerror={onPostImageError} />
    </a>
    {#if publication.description}
      <p class="text-base font-base font-mono">{publication.description}</p>
    {/if}
  </div>
{/snippet}

<div class="mx-auto flex w-full max-w-250 flex-col">
  {#if searchResults.length > 0}
    <!-- svelte-ignore a11y_consider_explicit_label -->
    <button class="fixed z-0 appearance-none inset-0" onclick={() => (searchResults = [])}></button>
  {/if}
  <div class="sticky items-center p-2 gap-2 top-0 left-0 right-0 flex flex-row w-full z-20">
    <div class="relative w-full">
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
    <Button size="icon" class="p-1.5" onclick={() => (publierOpen = !publierOpen)}>
      <Plus class="size-full" />
    </Button>
  </div>

  <div class="w-full px-2 flex flex-col gap-12">
    {#each publications as publication}
      {@render card(publication)}
    {/each}
  </div>
</div>
