<script lang="ts">
  import { NavBack, SEO } from '$lib/components';
  import { resolve } from '$app/paths';
  import i18n from '$lib/i18n';
  import { ProfilePicture, Reaction } from '$lib/components/social';
  import { OutfitItemCard } from '$lib/components/wardrobe';
  import type { PageProps } from './$types';
  import { Button } from '$lib/components/ui/button';
  import { Pencil, Save, Trash2, X } from '@lucide/svelte';
  import { fade } from 'svelte/transition';
  import { invalidateAll } from '$app/navigation';
  import { Toaster } from '$lib/components/Toast/toast';
  import { logger } from '$lib/utils';
  import * as Field from '$lib/components/ui/field';
  import { Textarea } from '$lib/components/ui/textarea';
  import PictureTaker from '$lib/components/PictureTaker.svelte';
  import * as Dialog from '$lib/components/ui/dialog';
  import { enhance } from '$app/forms';
  import Globals from '$lib/globals.svelte';
  import { onDestroy, onMount } from 'svelte';

  let { data }: PageProps = $props();
  let post = $derived(data.post);
  let user = $derived(data.user);
  let hasUserPostedToday = $derived(data.hasUserPostedToday);
  let editModeEnabled = $state(false);
  // svelte-ignore state_referenced_locally
  let editedPost = $state({ ...post });
  let deletePostConfirmOpen = $state(false);
  let editedPostImage = $state<string | null>(null);
  let isDeletingPost = $state(false);

  function onPostImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/1255/image-not-found.svg';
  }

  async function saveChanges() {
    if (user?.id !== post.user.id || !editModeEnabled) return;
    try {
      const formData = new FormData();
      if (editedPostImage) {
        const response = await fetch(editedPostImage);
        const blob = await response.blob();
        const image = new File([blob], 'picture.png', { type: blob.type });
        formData.append('image', image);
      }
      for (const [key, value] of Object.entries({
        id: post.id,
        description: editedPost.description,
      })) {
        // This is janky but works for the time being
        formData.append(key, value as string);
      }
      const res = await fetch(`/api/social/publication`, {
        method: 'PATCH',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      editModeEnabled = false;
      await invalidateAll();
      Toaster.success('successes.social.post.edited');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error(msg);
      Toaster.error(msg as any);
    }
  }

  onMount(() => {
    Globals.navBack.backButton.shown = true;
  });

  onDestroy(() => {
    Globals.navBack.backButton.shown = false;
  });
</script>

<SEO title="seo.social.post.title" description="seo.social.post.description" />

<!-- Delete post confirm modal -->
<Dialog.Root bind:open={deletePostConfirmOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{i18n.t('social.post.delete.title')}</Dialog.Title>
      <Dialog.Description>{i18n.t('social.post.delete.description')}</Dialog.Description>
    </Dialog.Header>
    <form
      class="mt-6 flex flex-col gap-4 h-full grow"
      method="POST"
      action="?/delete"
      use:enhance={() => {
        isDeletingPost = true;
        return async ({ update }) => {
          await update({ reset: false });
          isDeletingPost = false;
        };
      }}
    >
      <Dialog.Footer class="mt-auto">
        <Button
          type="button"
          variant="outline"
          disabled={isDeletingPost}
          onclick={() => (deletePostConfirmOpen = false)}
          >{i18n.t('social.post.delete.cancel')}</Button
        >
        <Button
          type="submit"
          variant="destructive"
          disabled={isDeletingPost}
          loading={isDeletingPost}>{i18n.t('social.post.delete.confirm')}</Button
        >
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>

<!-- <NavBack title="{post.user.username} - {i18n.t('seo.social.post.title')}" /> -->
<section class="lg:p-2 lg:pt-4 lg:pl-4 max-lg:p-4 w-full" data-post={post.id}>
  <div class="bg-card relative border-border flex flex-col rounded-lg border lg:flex-row">
    <!-- Image -->
    <div
      class="relative block -ml-2 max-lg:-mr-2 -mt-2 lg:-mb-2 lg:max-w-1/2 lg:w-full bg-primary border border-border rounded-lg overflow-hidden"
    >
      {#if editModeEnabled}
        <div class="absolute inset-0">
          <PictureTaker
            class={{
              container:
                'border-0 max-h-max min-h-0 h-full backdrop-blur-xs hover:backdrop-blur-md transition-all bg-card/70 hover:bg-card/70',
              image: 'h-full',
            }}
            onPictureTaken={(file) => {
              editedPostImage = file;
            }}
          />
        </div>
      {/if}
      <!-- svelte-ignore a11y_missing_attribute -->
      <img
        src={post.imageUrl}
        class="size-full object-center object-cover aspect-3/4"
        onerror={onPostImageError}
      />
      {#if hasUserPostedToday}
        <Reaction bind:post class="absolute bottom-2 right-2 z-10" />
      {:else}
        <div class="absolute p-4 inset-0 flex flex-col items-center justify-center">
          <p class="text-xl text-center text-background font-bold w-fit">
            {i18n.t('social.post.blurred')}
          </p>
        </div>
      {/if}
    </div>

    <!-- Details -->
    <div class="flex w-full flex-col gap-4 p-2 lg:grow lg:p-4">
      <div class="flex items-start justify-between gap-2">
        <a
          href={resolve('/app/[username]', { username: `@${post.user.username}` })}
          class="flex flex-row items-center gap-2"
        >
          <ProfilePicture userId={post.user.id} />
          <p class="ml-1">{post.user.username}</p>
        </a>
        {#if user?.id === post.user.id}
          <div class="flex flex-row">
            <Button
              variant="outline"
              size="icon"
              onclick={() => {
                if (editModeEnabled) {
                  saveChanges();
                } else {
                  editModeEnabled = true;
                }
              }}
            >
              <div class="size-4">
                {#if editModeEnabled}
                  <span in:fade={{ duration: 400 }}>
                    <Save class="size-full" />
                  </span>
                {:else}
                  <span in:fade={{ duration: 400 }}>
                    <Pencil class="size-full" />
                  </span>
                {/if}
              </div>
            </Button>
            {#if editModeEnabled}
              <Button
                class="ml-2"
                variant="destructive"
                size="icon"
                onclick={() => {
                  editModeEnabled = false;
                  editedPost = { ...post };
                }}
              >
                <X class="size-4" />
              </Button>
            {:else}
              <Button
                class="ml-2"
                variant="destructive"
                size="icon"
                onclick={() => {
                  deletePostConfirmOpen = true;
                }}
              >
                <Trash2 class="size-4" />
              </Button>
            {/if}
          </div>
        {/if}
      </div>
      {#if post.description}
        {#if editModeEnabled}
          <Field.Field>
            <Field.Label for="description"
              >{i18n.t('social.feed.addPublication.description.label')}</Field.Label
            >
            <Textarea
              id="description"
              name="description"
              rows={2}
              bind:value={editedPost.description}
            />
          </Field.Field>
        {:else}
          <div class="p-2 pt-4 rounded-lg border border-border w-full relative">
            <span class="bg-card top-0 -translate-y-1/2 left-2 absolute text-sm font-mono">
              {i18n.t('wardrobe.createItem.fields.description')}</span
            >
            <p class="font-mono text-base font-normal wrap-normal">{post.description}</p>
          </div>
        {/if}
      {/if}
      {#if post.outfit}
        <div
          class="grid gap-x-6 w-full gap-y-4 p-4"
          style="grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));"
        >
          {#each post.outfit.items as item (item.id)}
            <OutfitItemCard element="a" {item} />
          {/each}
        </div>
      {/if}
    </div>
  </div>
</section>
