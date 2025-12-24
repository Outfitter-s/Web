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
  import { cn, logger } from '$lib/utils';
  import * as Field from '$lib/components/ui/field';
  import { Textarea } from '$lib/components/ui/textarea';
  import * as Dialog from '$lib/components/ui/dialog';
  import { enhance } from '$app/forms';
  import * as Carousel from '$lib/components/ui/carousel';
  import type { CarouselAPI } from '$lib/components/ui/carousel/context';

  let { data }: PageProps = $props();
  let post = $derived(data.post);
  let user = $derived(data.user);
  let hasUserPostedToday = $derived(data.hasUserPostedToday);
  let editModeEnabled = $state(false);
  // svelte-ignore state_referenced_locally
  let editedPost = $state({ ...post });
  let deletePostConfirmOpen = $state(false);
  let isDeletingPost = $state(false);
  let carouselCurrentIndex = $state(0);
  let carouselApi = $state<CarouselAPI>();

  $effect(() => {
    if (carouselApi) {
      carouselCurrentIndex = carouselApi.selectedScrollSnap() + 1;
      carouselApi.on('select', () => {
        carouselCurrentIndex = carouselApi!.selectedScrollSnap() + 1;
      });
    }
  });

  function onPostImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/1255/image-not-found.svg';
  }

  async function saveChanges() {
    if (user?.id !== post.user.id || !editModeEnabled) return;
    try {
      const formData = new FormData();
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

<NavBack title="{post.user.username} - {i18n.t('seo.social.post.title')}" />
<div class="lg:p-2 max-lg:pt-2 lg:pl-4 max-lg:p-4 max-w-375 mx-auto w-full" data-post={post.id}>
  <div class="bg-card relative border-border flex flex-col rounded-lg border lg:flex-row">
    <!-- Image -->
    <div
      class="relative block -ml-2 max-lg:-mr-2 -mt-2 lg:-mb-2 lg:max-w-1/2 lg:w-full bg-card border border-border rounded-lg overflow-hidden"
    >
      <!-- svelte-ignore a11y_missing_attribute -->
      <Carousel.Root class="w-full" setApi={(emblaApi) => (carouselApi = emblaApi)}>
        <Carousel.Content>
          {#each post.images as image}
            <Carousel.Item>
              <img
                src={image}
                class="size-full object-center object-cover aspect-9/12"
                onerror={onPostImageError}
              />
            </Carousel.Item>
          {/each}
        </Carousel.Content>
      </Carousel.Root>
      {#if hasUserPostedToday}
        <Reaction bind:post class="absolute bottom-2 right-2 z-10" />
      {:else}
        <div
          class="absolute rounded-lg p-4 backdrop-blur-md inset-0 flex flex-col items-center justify-center"
        >
          <p class="text-xl text-center text-background font-bold w-fit">
            {i18n.t('social.post.blurred')}
          </p>
        </div>
      {/if}

      <div class="absolute flex flex-row gap-2 bottom-4 left-1/2 -translate-x-1/2">
        {#each Array(post.images.length), i}
          {@const active = i === carouselCurrentIndex - 1}
          <!-- svelte-ignore a11y_consider_explicit_label -->
          <button
            class={cn(
              'h-2 rounded-full duration-300 transition-all',
              active ? 'bg-primary w-6' : 'bg-primary/50 w-2'
            )}
            onclick={() => {
              if (carouselApi) {
                carouselApi.scrollTo(i);
              }
            }}
          ></button>
        {/each}
      </div>
    </div>

    <!-- Details -->
    <div class="flex w-full flex-col gap-4 p-2 lg:grow lg:p-4">
      <div class="flex items-start justify-between gap-2">
        <a
          href={resolve('/app/[username]', { username: `@${post.user.username}` })}
          class="flex flex-row items-center gap-2"
        >
          <ProfilePicture userId={post.user.id} class="scale-120" />
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
          style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));"
        >
          {#each post.outfit.items as item (item.id)}
            <OutfitItemCard element="a" {item} />
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
