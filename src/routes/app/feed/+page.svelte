<script lang="ts">
  import * as InputGroup from '$lib/components/ui/input-group';
  import i18n from '$lib/i18n';
  import { Search, Plus } from '@lucide/svelte';
  import type { Publication, User } from '$lib/types';
  import { logger } from '$lib/utils';
  import { Toaster } from '$lib/components/Toast/toast';
  import { flip } from 'svelte/animate';
  import { slide } from 'svelte/transition';
  import { SEO, Spinner } from '$lib/components';
  import { resolve } from '$app/paths';
  import { Button } from '$lib/components/ui/button';
  import Publier from './publier.svelte';
  import { ProfilePicture, Post } from '$lib/components/social';
  import { onMount } from 'svelte';

  let publications = $state<Publication[]>([]);
  let searchResults = $state<User[]>([]);
  let publierOpen = $state(false);
  let offset = $state(0);
  let loadingMore = $state(false);
  let noMorePosts = $state(false);
  const POST_LIMIT = 20;

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

  async function getFeed() {
    if (loadingMore || noMorePosts) return;
    loadingMore = true;
    try {
      const res = await fetch(`/api/social/getFeed?limit=${POST_LIMIT}&offset=${offset}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      publications.push(...result.feed);
      offset += publications.length;
      if (result.feed.length < POST_LIMIT) {
        noMorePosts = true;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error('Error fetching feed:', msg);
      Toaster.error(msg as any);
    } finally {
      loadingMore = false;
    }
  }

  onMount(() => {
    getFeed();
    function onScroll() {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && !loadingMore) {
        getFeed();
      }
    }
    window.addEventListener('scroll', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  });
</script>

<Publier bind:open={publierOpen} />
<SEO title="seo.social.feed.title" description="seo.social.feed.description" />

<div class="mx-auto flex w-full max-w-250 flex-col">
  {#if searchResults.length > 0}
    <!-- svelte-ignore a11y_consider_explicit_label -->
    <button class="fixed z-0 appearance-none inset-0" onclick={() => (searchResults = [])}></button>
  {/if}
  <div
    class="sticky items-center bg-background p-2 gap-2 top-0 left-0 right-0 flex flex-row w-full z-20"
  >
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
    {#each publications as post (post.id)}
      <Post {post} />
    {/each}
  </div>

  {#if loadingMore}
    <div
      class="w-full p-4 flex flex-row items-center justify-center gap-4"
      transition:slide={{ axis: 'y', duration: 300 }}
    >
      <Spinner />
      {i18n.t('social.feed.loadingMore')}
    </div>
  {/if}
  {#if noMorePosts}
    <p class="text-lg font-medium my-8 text-center">{i18n.t('social.feed.noMorePosts')}</p>
  {/if}
</div>
