<script lang="ts">
  import { Toaster } from '$lib/components/Toast/toast';
  import type { PageProps } from './$types';
  import { Button } from '$lib/components/ui/button';
  import { Post, ProfilePicture } from '$lib/components/social';
  import i18n from '$lib/i18n';
  import type { Publication } from '$lib/types';
  import { logger } from '$lib/utils';
  import { slide } from 'svelte/transition';
  import { SEO, Spinner } from '$lib/components';
  import { onMount } from 'svelte';

  let posts = $state<Publication[]>([]);
  let offset = $state<number>(0);
  let loadingMore = $state<boolean>(false);
  let noMorePosts = $state<boolean>(false);
  const POST_LIMIT = 20;
  let { data }: PageProps = $props();
  // svelte-ignore state_referenced_locally
  let user = $derived(data.user);
  let pageUser = $derived(data.pageUser);
  // svelte-ignore state_referenced_locally
  let lastPageUsername = $state(pageUser.username);
  let nbFollowers = $derived(data.nbFollowers);
  let isFollowingAction = $state(false);
  let youFollow = $derived(user.following.includes(pageUser.id));
  let isYourProfile = $derived(user.id === pageUser.id);
  let isFollowingYou = $derived(pageUser.following.includes(user.id));

  async function toggleFollow() {
    if (isFollowingAction || isYourProfile) return;
    isFollowingAction = true;
    try {
      const res = await fetch(`/api/social/follow`, {
        method: youFollow ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: pageUser.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      if (youFollow) {
        user.following = user.following.filter((id) => id !== pageUser.id);
        nbFollowers -= 1;
      } else {
        user.following.push(pageUser.id);
        nbFollowers += 1;
      }
      Toaster.success(
        i18n.t(
          youFollow ? 'successes.social.follow.followed' : 'successes.social.follow.unfollowed',
          { username: pageUser.username }
        )
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error('Error toggling follow status:', msg);
      Toaster.error(msg as any);
    } finally {
      isFollowingAction = false;
    }
  }

  async function getFeed() {
    if (loadingMore || noMorePosts) return;
    loadingMore = true;
    try {
      const res = await fetch(
        `/api/social/getUsersPublications?userId=${pageUser.id}&limit=${POST_LIMIT}&offset=${offset}`
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      posts.push(...result.feed);
      offset += result.feed.length;
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

  $effect(() => {
    getFeed();
  });

  $effect(() => {
    // Reset feed when pageUser changes
    if (lastPageUsername === pageUser.username) return;
    lastPageUsername = pageUser.username;
    posts = [];
    offset = 0;
    noMorePosts = false;
    getFeed();
  });
</script>

<SEO
  title={i18n.t('seo.social.profile.title', { username: pageUser.username })}
  description={i18n.t('seo.social.profile.description', { username: pageUser.username })}
/>

<section class="flex w-full flex-col gap-4 p-2 items-start">
  <div class="flex flex-row gap-6 items-center">
    <div class="rounded-full border-border border overflow-hidden size-24 bg-card">
      <ProfilePicture userId={pageUser.id} class="size-full" />
    </div>
    <div class="flex flex-col gap-2">
      <h1 class="text-xl font-medium">{pageUser.username}</h1>
      <div class="flex flex-row items-center gap-6 text-sm text-muted-foreground">
        <span
          >{@html i18n.t('social.profile.nbFollowers', {
            count: String(nbFollowers),
            s: nbFollowers > 1 ? 's' : '',
          })}</span
        >
        <span>-</span>
        <span
          >{@html i18n.t('social.profile.nbFollowing', {
            count: String(pageUser.following.length),
            s: pageUser.following.length > 1 ? 's' : '',
          })}</span
        >
      </div>
    </div>
  </div>

  {#if user.id !== pageUser.id}
    <div class="flex flex-row gap-2 justify-between items-center w-full">
      <Button
        onclick={toggleFollow}
        loading={isFollowingAction}
        disabled={isFollowingAction || isYourProfile}
        >{i18n.t(
          youFollow ? 'social.profile.follow.unfollow' : 'social.profile.follow.follow'
        )}</Button
      >

      <span class="text-sm text-muted-foreground"
        >{i18n.t(
          isFollowingYou ? 'social.profile.isFollowing' : 'social.profile.notFollowing'
        )}</span
      >
    </div>
  {/if}

  <div class="w-full flex flex-col gap-12">
    {#each posts as post (post.id)}
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
    <p class="text-lg font-medium my-8 text-center w-full">{i18n.t('social.feed.noMorePosts')}</p>
  {/if}
</section>
