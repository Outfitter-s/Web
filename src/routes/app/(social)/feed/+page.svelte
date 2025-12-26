<script lang="ts">
  import i18n from '$lib/i18n';
  import type { FeedType, Publication } from '$lib/types';
  import { cn, logger } from '$lib/utils';
  import { Toaster } from '$lib/components/Toast/toast';
  import { slide } from 'svelte/transition';
  import { SEO, Spinner } from '$lib/components';
  import { Post } from '$lib/components/social';
  import { onMount } from 'svelte';

  let posts = $state<Record<FeedType, Publication[]>>({ forYou: [], followed: [] });

  let loadingMore = $state<Record<FeedType, boolean>>({ forYou: false, followed: false });
  let noMorePosts = $state<Record<FeedType, boolean>>({ forYou: false, followed: false });
  let activeFeedTab = $state<FeedType>('forYou');
  const POST_LIMIT = 20;

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
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  });

  $effect(() => {
    getFeed(activeFeedTab);
  });
</script>

<SEO title="seo.social.feed.title" description="seo.social.feed.description" />

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
