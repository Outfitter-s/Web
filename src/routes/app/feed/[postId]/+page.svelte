<script lang="ts">
  import { NavBack, SEO } from '$lib/components';
  import { resolve } from '$app/paths';
  import i18n from '$lib/i18n';
  import { ProfilePicture, Reaction } from '$lib/components/social';
  import { OutfitItemCard } from '$lib/components/wardrobe';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  let post = $derived(data.post);

  function onPostImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/1255/image-not-found.svg';
  }
</script>

<SEO title="seo.social.post.title" description="seo.social.post.description" />

<NavBack title="{post.user.username} - {i18n.t('seo.social.post.title')}" />
<div
  class="lg:p-2 max-lg:pt-2 lg:pl-4 max-lg:p-4 max-w-[1500px] mx-auto w-full"
  data-post={post.id}
>
  <div class="bg-card relative border-border flex flex-col rounded-lg border lg:flex-row">
    <!-- Image -->
    <div
      class="relative block -ml-2 max-lg:-mr-2 -mt-2 lg:-mb-2 lg:max-w-1/2 lg:w-full bg-primary border border-border rounded-lg overflow-hidden"
    >
      <!-- svelte-ignore a11y_missing_attribute -->
      <img
        src={post.imageUrl}
        class="size-full object-center object-cover aspect-[9/12]"
        onerror={onPostImageError}
      />
      <Reaction bind:post class="absolute bottom-2 right-2 z-10" />
    </div>

    <!-- Details -->
    <div class="flex w-full lg:grow flex-col gap-6 p-2 lg:p-4">
      <a
        href={resolve('/app/[username]', { username: `@${post.user.username}` })}
        class="flex flex-row items-center gap-2"
      >
        <ProfilePicture userId={post.user.id} class="scale-120" />
        <p class="ml-1">{post.user.username}</p>
      </a>
      {#if post.description}
        <div class="p-2 pt-4 rounded-lg border border-border w-full relative">
          <span class="bg-card top-0 -translate-y-1/2 left-2 absolute text-sm font-mono">
            {i18n.t('wardrobe.createItem.fields.description')}</span
          >
          <p class="font-mono text-base font-normal wrap-normal">{post.description}</p>
        </div>
      {/if}
      {#if post.outfit}
        <div
          class="grid gap-x-6 w-full gap-y-4 p-4"
          style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));"
        >
          {#each post.outfit.items as item}
            <OutfitItemCard element="a" {item} />
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
