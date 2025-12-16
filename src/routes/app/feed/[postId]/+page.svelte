<script lang="ts">
  import { page } from '$app/state';
  import type { Publication } from '$lib/types';
  import { capitalize, cn, DateUtils } from '$lib/utils';
  import { Calendar, Palette, Shirt, Pencil, ChevronLeft } from '@lucide/svelte';
  import ColorDot from '$lib/components/colorDot.svelte';
  import { Button } from '$lib/components/ui/button';
  import { NavBack, OutfitItemCard, ProfilePicture, SEO } from '$lib/components';
  import { resolve } from '$app/paths';
  import i18n from '$lib/i18n';

  let postId = $derived<string>(page.params.postId as string);
  let posts = $derived<Publication[]>(page.data.publications);
  let post = $derived(posts.find((it) => it.id === postId));

  $effect(() => {
    if (!post) {
      throw new Error('Post not found'); // TODO: i18n
    }
  });

  function onPostImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/1255/image-not-found.svg';
  }
</script>

<SEO title="seo.social.post.title" description="seo.social.post.description" />

{#if post}
  <NavBack title="{post.user.username} - {i18n.t('seo.social.post.title')}" />
  <div class="lg:p-2 max-lg:pt-2 max-lg:p-4 lg:pl-4">
    <div class="bg-card relative border-border flex flex-col rounded-lg border lg:flex-row">
      <!-- Image -->
      <div
        class="max-lg:-ml-2 shrink-0 border border-border max-lg:-mt-2 rounded-lg overflow-hidden bg-primary max-lg:-mr-2 h-full max-h-[70vh] lg:max-h-200"
      >
        <!-- svelte-ignore a11y_missing_attribute -->
        <img
          src={post.imageUrl}
          class="w-full object-cover object-center aspect-10/14"
          onerror={onPostImageError}
        />
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
{/if}
