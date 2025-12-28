<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import i18n from '$lib/i18n';
  import { type Publication } from '$lib/types';
  import { DateUtils } from '$lib/utils';
  import { ProfilePicture } from '.';
  import IndentCard from '../IndentCard.svelte';
  import Reaction from './Reaction.svelte';

  interface Props {
    post: Publication;
  }

  let { post = $bindable() }: Props = $props();

  let hasUserPostedToday = $derived<boolean>(page.data.hasUserPostedToday);
</script>

<IndentCard imageUrl={post.images[0]} href={resolve('/app/feed/[postId]', { postId: post.id })}>
  <a
    href={resolve('/app/[username]', { username: `@${post.user.username}` })}
    class="flex flex-row items-center gap-2"
  >
    <ProfilePicture class="size-6" userId={post.user.id} />
    <p class="ml-1 font-mono text-base">
      {post.user.username}
    </p>
  </a>
  {#snippet extraContent()}
    <!-- Description text + bottom gradient -->
    <div
      class="absolute bottom-0 left-0 right-0 p-2 pb-0 pt-16 bg-linear-to-b from-transparent to-background pointer-events-none"
    >
      {#if post.description}
        <p class="text-base font-medium font-mono line-clamp-2">
          {post.description}
        </p>
      {/if}
    </div>
    {#if !hasUserPostedToday}
      <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p class="text-xl text-background text-center font-bold w-fit">
          {i18n.t('social.post.blurred')}
        </p>
      </div>
    {:else}
      <Reaction bind:post class="absolute bottom-2 right-2" />
    {/if}

    <!-- Date -->
    <div
      class="px-2 py-1 top-2 right-2 bg-background/50 text-xs text-foreground font-medium absolute backdrop-blur rounded-full pointer-events-none"
    >
      {DateUtils.formatDate(new Date(post.createdAt))}
    </div>
  {/snippet}
</IndentCard>
