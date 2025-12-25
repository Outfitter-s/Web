<script lang="ts">
  import * as InputGroup from '$lib/components/ui/input-group';
  import i18n from '$lib/i18n';
  import { Search, Plus } from '@lucide/svelte';
  import type { FeedType, Publication, User } from '$lib/types';
  import { cn, logger } from '$lib/utils';
  import { Toaster } from '$lib/components/Toast/toast';
  import { flip } from 'svelte/animate';
  import { slide } from 'svelte/transition';
  import { SEO, Spinner } from '$lib/components';
  import { resolve } from '$app/paths';
  import { Button } from '$lib/components/ui/button';
  import Publier from './publier.svelte';
  import { ProfilePicture, Post } from '$lib/components/social';
  import { onDestroy, onMount } from 'svelte';
  import Globals from '$lib/globals.svelte';
  import Backdrop from '$lib/components/ui/dialog/backdrop.svelte';

  let posts = $state<Record<FeedType, Publication[]>>({ forYou: [], followed: [] });
  let searchResults = $state<User[]>([]);
  let publierOpen = $state(false);
  let loadingMore = $state<Record<FeedType, boolean>>({ forYou: false, followed: false });
  let noMorePosts = $state<Record<FeedType, boolean>>({ forYou: false, followed: false });
  let activeFeedTab = $state<FeedType>('forYou');
  const POST_LIMIT = 20;
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

  async function getFeed(type: FeedType) {
    if (loadingMore[type] || noMorePosts[type]) return;
    loadingMore[type] = true;
    try {
      const seenPostsIds = posts[type].map((p) => p.id);
      const res = await fetch(
        `/api/social/getFeed?type=${type}&limit=${POST_LIMIT}&seenPostIds=${encodeURIComponent(
          JSON.stringify(seenPostsIds)
        )}`
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      posts[type].push(...result.feed);
      if (result.feed.length < POST_LIMIT) {
        noMorePosts[type] = true;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error('Error fetching feed:', msg);
      Toaster.error(msg as any);
    } finally {
      loadingMore[type] = false;
    }
  }

  onMount(() => {
    function onScroll() {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && !loadingMore) {
        getFeed(activeFeedTab);
      }
    }
    window.addEventListener('scroll', onScroll);

    Globals.navBack.trailing = navTrailing;
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  });

  $effect(() => {
    getFeed(activeFeedTab);
  });

  onDestroy(() => {
    Globals.navBack.trailing = undefined;
  });
</script>

<Publier bind:open={publierOpen} />
<SEO title="seo.social.feed.title" description="seo.social.feed.description" />

{#snippet navTrailing()}
  <Button
    variant="none"
    class="p-1! size-auto h-full aspect-square max-h-8 dark:bg-primary bg-background rounded-full text-foreground dark:text-background"
    onclick={() => (searchOpen = !searchOpen)}
  >
    <Search class="size-full" />
  </Button>
  <Button
    variant="none"
    class="p-1! size-auto h-full aspect-square max-h-8 dark:bg-primary bg-background rounded-full text-foreground dark:text-background"
    onclick={() => (publierOpen = !publierOpen)}
  >
    <Plus class="size-full" />
  </Button>
{/snippet}

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

<section class="flex w-full flex-col">
  <!-- Feed type selector -->
  <div class="p-2">
    <div class="grid grid-cols-2 w-full gap-2 bg-card rounded">
      <button
        class={cn(
          'w-full py-1 rounded-md',
          activeFeedTab === 'forYou' && 'bg-primary text-primary-foreground'
        )}
        onclick={() => (activeFeedTab = 'forYou')}
      >
        {i18n.t('social.feed.forYou')}
      </button>
      <button
        class={cn(
          'w-full py-1 rounded-md',
          activeFeedTab === 'followed' && 'bg-primary text-primary-foreground'
        )}
        onclick={() => (activeFeedTab = 'followed')}
      >
        {i18n.t('social.feed.followedFeed')}
      </button>
    </div>
  </div>

  <div class="w-full px-2 flex flex-col gap-12">
    {#each posts[activeFeedTab] as post, i (post.id)}
      <Post bind:post={posts[activeFeedTab][i]} />
    {/each}
  </div>

  {#if loadingMore[activeFeedTab]}
    <div
      class="w-full p-4 flex flex-row items-center justify-center gap-4"
      transition:slide={{ axis: 'y', duration: 300 }}
    >
      <Spinner />
      {i18n.t('social.feed.loadingMore')}
    </div>
  {/if}
  {#if noMorePosts[activeFeedTab]}
    <p class="text-lg font-medium my-8 text-center">{i18n.t('social.feed.noMorePosts')}</p>
  {/if}
</section>
