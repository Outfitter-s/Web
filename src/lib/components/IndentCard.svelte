<script lang="ts">
  import { cn } from '$lib/utils';
  import type { Snippet } from 'svelte';
  import type { SvelteHTMLElements } from 'svelte/elements';

  interface Props {
    imageUrl: string;
    href?: string;
    extraContent?: Snippet;
  }

  let {
    children,
    imageUrl,
    href,
    extraContent,
    class: className,
    ...restProps
  }: Props & SvelteHTMLElements['div'] = $props();

  let containerWidth = $state(0);
  let imageLoaded = $state(false);
  let containerHeight = $state(0);
  let userWidth = $state(0);
  let userHeight = $state(0);
  let containerRef = $state<HTMLDivElement | null>(null);
  let userRef = $state<HTMLDivElement | null>(null);

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

<div class="flex flex-col w-full gap-2 relative" bind:this={containerRef} {...restProps}>
  <!-- Top left corner: user -->
  <div
    bind:this={userRef}
    class="flex flex-row items-center max-w-[60%] absolute top-0 p-2 w-fit gap-2 z-10"
  >
    {@render children?.()}
  </div>

  <!-- Image -->
  <div class={cn('w-full post overflow-hidden', className)} style:clip-path={clipPathStyle}>
    <a class="size-full block relative" {href}>
      <!-- svelte-ignore a11y_missing_attribute -->
      <img
        src={imageUrl}
        draggable="false"
        class="w-full block h-full object-contain object-center"
        onload={() => (imageLoaded = true)}
      />
      {#if !imageLoaded}
        <div class="absolute inset-0 bg-accent animate-pulse"></div>
      {/if}
    </a>
  </div>

  {@render extraContent?.()}
</div>

<style>
  .post {
    aspect-ratio: 3 / 4;
  }
</style>
