<script lang="ts">
  import { page } from '$app/state';
  import type { Publication } from '$lib/types';
  import { capitalize, cn, DateUtils } from '$lib/utils';
  import { Calendar, Palette, Shirt, Pencil, ChevronLeft } from '@lucide/svelte';
  import ColorDot from '$lib/components/colorDot.svelte';
  import { Button } from '$lib/components/ui/button';
  import { NavBack, ProfilePicture, SEO } from '$lib/components';
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
<!-- TODO: add outfit items to page -->
{#if post}
  <NavBack title="{post.user.username} - {i18n.t('seo.social.post.title')}" />
  <div class="lg:p-2 max-lg:pt-2 max-lg:p-4 lg:pl-4">
    <div class="bg-card relative border-border flex flex-col rounded-lg border lg:flex-row">
      <!-- Image -->
      <div
        class="-ml-2 border border-border -mt-2 rounded-lg overflow-hidden bg-primary lg:-mb-2 max-lg:-mr-2 max-h-[70vh] lg:max-h-200 aspect-10/14 lg:aspect-square inline-block"
      >
        <!-- svelte-ignore a11y_missing_attribute -->
        <img
          src={post.imageUrl}
          class="size-full object-cover object-center"
          onerror={onPostImageError}
        />
      </div>

      <!-- Details -->
      <div class="flex w-full flex-col gap-4 p-2 lg:w-1/2 lg:p-4">
        <a
          href={resolve('/app/[username]', { username: `@${post.user.username}` })}
          class="flex flex-row items-center gap-2"
        >
          <ProfilePicture userId={post.user.id} class="scale-120" />
          <p class="ml-1">{post.user.username}</p>
        </a>
        <p class="font-mono text-base font-normal wrap-normal">{post.description}</p>
      </div>
    </div>
  </div>
{/if}
