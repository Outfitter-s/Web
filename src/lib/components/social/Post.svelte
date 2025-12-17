<script lang="ts">
  import { resolve } from '$app/paths';
  import { type Publication } from '$lib/types';
  import { DateUtils } from '$lib/utils';
  import { ProfilePicture } from '.';
  import Reaction from './Reaction.svelte';

  interface Props {
    post: Publication;
  }

  let { post }: Props = $props();
  function onPostImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/1255/image-not-found.svg';
  }
</script>

<div class="flex flex-col w-full gap-2" data-post={post.id}>
  <div class="flex flex-row items-center justify-between w-full">
    <a
      href={resolve('/app/[username]', { username: `@${post.user.username}` })}
      class="flex flex-row items-center gap-2"
    >
      <ProfilePicture userId={post.user.id} class="scale-120" />
      <p class="ml-1">{post.user.username}</p>
    </a>

    <span class="text-sm text-muted-foreground">
      {DateUtils.formatDate(new Date(post.createdAt))}
    </span>
  </div>
  <div class="w-full relative">
    <a class="w-full relative" href={resolve('/app/feed/[postId]', { postId: post.id })}>
      <!-- svelte-ignore a11y_missing_attribute -->
      <img src={post.imageUrl} class="rounded w-full" onerror={onPostImageError} />
    </a>
    <Reaction {post} class="absolute bottom-2 right-2" />
  </div>
  {#if post.description}
    <p class="text-base font-base font-mono">{post.description}</p>
  {/if}
</div>
