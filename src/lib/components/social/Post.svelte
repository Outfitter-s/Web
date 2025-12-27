<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import i18n from '$lib/i18n';
  import { type Publication } from '$lib/types';
  import { DateUtils } from '$lib/utils';
  import { ProfilePicture } from '.';
  import Reaction from './Reaction.svelte';

  interface Props {
    post: Publication;
  }

  let { post = $bindable() }: Props = $props();

  let hasUserPostedToday = $derived<boolean>(page.data.hasUserPostedToday);
  let containerWidth = $state(0);
  let imageLoaded = $state(false);
  let containerHeight = $state(0);
  let userWidth = $state(0);
  let userHeight = $state(0);
  let containerRef = $state<HTMLDivElement | null>(null);
  let userRef = $state<HTMLAnchorElement | null>(null);

  $effect(() => {
    if (!containerRef || !userRef) return;
    const update = () => {
      containerWidth = containerRef!.offsetWidth;
      containerHeight = containerRef!.offsetHeight;
      userWidth = userRef!.offsetWidth;
      userHeight = userRef!.offsetHeight;
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(containerRef);
    observer.observe(userRef);
    return () => observer.disconnect();
  });

  const clipPathStyle = $derived.by(() => {
    if (!containerWidth || !containerHeight) return '';

    const R = 24; // Outer border radius
    const r = 16; // Notch border radius
    const w = Math.min(userWidth * 1.1, containerWidth * 0.6); // Notch width (with some buffer)
    const h = userHeight; // Notch height

    // Ensure radii don't overlap
    const safeR = Math.min(R, containerWidth / 2, containerHeight / 2);
    const safe_r = Math.min(r, w / 2, h / 2);

    return `path('M ${w + safe_r} 0 L ${containerWidth - safeR} 0 A ${safeR} ${safeR} 0 0 1 ${containerWidth} ${safeR} V ${containerHeight} A 0 0 0 0 1 ${containerWidth - safeR} ${containerHeight} H ${safeR} A 0 0 0 0 1 0 ${containerHeight} V ${h + safe_r} A ${safe_r} ${safe_r} 0 0 1 ${safe_r} ${h} H ${w - safe_r} A ${safe_r} ${safe_r} 0 0 0 ${w} ${h - safe_r} V ${safe_r} A ${safe_r} ${safe_r} 0 0 1 ${w + safe_r} 0 Z')`;
  });
</script>

<div class="flex flex-col w-full gap-2 relative" data-post={post.id} bind:this={containerRef}>
  <!-- Top left corner: user -->
  <a
    bind:this={userRef}
    href={resolve('/app/[username]', { username: `@${post.user.username}` })}
    class="flex flex-row items-center absolute top-0 p-2 w-fit gap-2 z-10"
  >
    <ProfilePicture class="size-6" userId={post.user.id} />
    <p class="ml-1 font-mono text-base">
      {post.user.username}
    </p>
  </a>

  <!-- Image -->
  <div class="w-full post overflow-hidden" style:clip-path={clipPathStyle}>
    <a class="size-full block relative" href={resolve('/app/feed/[postId]', { postId: post.id })}>
      <!-- svelte-ignore a11y_missing_attribute -->
      <img
        src={post.images[0]}
        class="w-full block h-full object-contain object-center"
        onload={() => (imageLoaded = true)}
      />
      {#if !imageLoaded}
        <div class="absolute inset-0 bg-accent animate-pulse"></div>
      {/if}
    </a>
    {#if !hasUserPostedToday && imageLoaded}
      <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p class="text-xl text-background text-center font-bold w-fit">
          {i18n.t('social.post.blurred')}
        </p>
      </div>
    {/if}
  </div>

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

  <!-- Reaction -->
  {#if hasUserPostedToday}
    <Reaction bind:post class="absolute bottom-2 right-2" />
  {/if}

  <!-- Date -->
  <div
    class="px-2 py-1 top-2 right-2 bg-background/50 absolute backdrop-blur rounded-full pointer-events-none"
  >
    <span class="text-xs text-foreground font-medium">
      {DateUtils.formatDate(new Date(post.createdAt))}
    </span>
  </div>
</div>

<style>
  .post {
    aspect-ratio: 3 / 4;
  }
</style>
