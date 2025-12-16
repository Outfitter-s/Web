<script lang="ts">
  import { Toaster } from '$lib/components/Toast/toast';
  import i18n from '$lib/i18n';
  import type { PageProps } from './$types';
  import { Button } from '$lib/components/ui/button';
  import { ProfilePicture } from '$lib/components/social';
  import { logger } from '$lib/utils';

  let { data }: PageProps = $props();
  // svelte-ignore state_referenced_locally
  let user = $state(data.user);
  let pageUser = $derived(data.pageUser);
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
</script>

<div class="mx-auto flex w-full max-w-250 flex-col gap-4 p-2 items-start">
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
      >{i18n.t(isFollowingYou ? 'social.profile.isFollowing' : 'social.profile.notFollowing')}</span
    >
  </div>
</div>
