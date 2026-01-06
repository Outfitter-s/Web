<script lang="ts">
  import { SEO } from '$lib/components';
  import { resolve } from '$app/paths';
  import i18n from '$lib/i18n';
  import { ProfilePicture, Reaction } from '$lib/components/social';
  import { OutfitItemCard } from '$lib/components/wardrobe';
  import type { PageProps } from './$types';
  import { Button } from '$lib/components/ui/button';
  import { Pencil, Plus, Save, Trash2, X } from '@lucide/svelte';
  import { fade } from 'svelte/transition';
  import { invalidateAll } from '$app/navigation';
  import { Toaster } from '$lib/components/Toast/toast';
  import { cn, DateUtils, logger } from '$lib/utils';
  import * as Field from '$lib/components/ui/field';
  import { Textarea } from '$lib/components/ui/textarea';
  import * as Dialog from '$lib/components/ui/dialog';
  import { enhance } from '$app/forms';
  import Globals from '$lib/globals.svelte';
  import { onDestroy, onMount } from 'svelte';
  import * as Carousel from '$lib/components/ui/carousel';
  import type { CarouselAPI } from '$lib/components/ui/carousel/context';
  import type { Comment } from '$lib/types';

  let { data, form }: PageProps = $props();
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
  let newComment = $state<{ open: boolean; processing: boolean; commentId: null | Comment['id'] }>({
    open: false,
    processing: false,
    commentId: null,
  });

  $effect(() => {
    if (carouselApi) {
      carouselCurrentIndex = carouselApi.selectedScrollSnap() + 1;
      carouselApi.on('select', () => {
        carouselCurrentIndex = carouselApi!.selectedScrollSnap() + 1;
      });
    }
  });

  $effect(() => {
    if (form && form.action === 'newComment') {
      if (form.success) {
        newComment.open = false;
        newComment.commentId = null;
        Toaster.success('successes.social.comment.added');
      } else {
        logger.error(form.message);
        Toaster.error(form.message as any);
      }
    }
  });

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

  onMount(() => {
    Globals.navBack.backButton.shown = true;
  });

  onDestroy(() => {
    Globals.navBack.backButton.shown = false;
  });

  const getCommentFromId = (id: Comment['id']): Comment | null => {
    function findComment(comments: Comment[]): Comment | null {
      for (const comment of comments) {
        if (comment.id === id) return comment;

        for (const reply of comment.replies) {
          const found = findComment([reply]);
          if (found) return found;
        }
      }
      return null;
    }
    return findComment(post.comments);
  };
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

<!-- New comment dialog -->
<Dialog.Root bind:open={newComment.open}>
  <Dialog.Content>
    <Dialog.Header>
      {#if newComment.commentId}
        <Dialog.Title
          >{i18n.t('social.post.comments.reply.title', {
            username: getCommentFromId(newComment.commentId)?.user.username,
          })}</Dialog.Title
        >
      {:else}
        <Dialog.Title>{i18n.t('social.post.comments.addComment.title')}</Dialog.Title>
      {/if}
    </Dialog.Header>
    <form
      class="mt-6 flex flex-col gap-4 h-full grow"
      method="POST"
      action="?/newComment"
      use:enhance={(e) => {
        newComment.processing = true;
        if (newComment.commentId) {
          e.formData.append('parentCommentId', newComment.commentId);
        }
        return async ({ update }) => {
          await update({ reset: false });
          newComment.processing = false;
        };
      }}
    >
      <Textarea
        name="content"
        rows={2}
        placeholder={i18n.t(
          newComment.commentId
            ? 'social.post.comments.reply.placeholder'
            : 'social.post.comments.addComment.placeholder'
        )}
      />
      <Dialog.Footer class="mt-auto">
        <Button
          type="button"
          variant="outline"
          disabled={newComment.processing}
          onclick={() => (newComment.open = false)}>{i18n.t('social.post.comments.cancel')}</Button
        >
        <Button type="submit" disabled={newComment.processing} loading={newComment.processing}
          >{i18n.t(
            newComment.commentId
              ? 'social.post.comments.reply.button'
              : 'social.post.comments.addComment.button'
          )}</Button
        >
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>

{#snippet comment(c: Comment)}
  <div class="flex flex-col">
    <div class="flex flex-row gap-2">
      <ProfilePicture userId={c.user.id} class="size-8 shrink-0" />
      <div class="flex flex-col">
        <a
          href={resolve('/app/[username]', { username: `@${c.user.username}` })}
          class="font-medium text-xs">{c.user.username}</a
        >
        <p class="text-base font-normal wrap-normal">{c.content}</p>
        <div class="flex flex-row gap-2 items-center">
          <span class="text-xs text-muted-foreground">{DateUtils.formatDate(c.createdAt)}</span>
          <Button
            variant="link"
            size="sm"
            onclick={() => {
              newComment.commentId = c.id;
              newComment.open = true;
            }}
          >
            {i18n.t('social.post.comments.reply.button')}
          </Button>
        </div>
      </div>
    </div>
    <!-- Replies -->
    {#if c.replies.length > 0}
      <div class="flex flex-col mt-4 pl-4 ml-4 border-l border-border gap-4">
        {#each c.replies as reply (reply.id)}
          {@render comment(reply)}
        {/each}
      </div>
    {/if}
  </div>
{/snippet}

<section class="lg:p-2 lg:pt-4 lg:pl-4 max-lg:p-4 w-full" data-post={post.id}>
  <div class="bg-card relative flex flex-col rounded-lg lg:flex-row">
    <!-- Image -->
    <div
      class="relative block -ml-2 max-lg:-mr-2 -mt-2 lg:-mb-2 lg:max-w-1/2 lg:w-full bg-card border border-border rounded-lg overflow-hidden"
    >
      <Carousel.Root class="size-full" setApi={(emblaApi) => (carouselApi = emblaApi)}>
        <Carousel.Content>
          {#each post.images as image}
            <Carousel.Item>
              <!-- svelte-ignore a11y_missing_attribute -->
              <img src={image} class="size-full object-center object-cover aspect-3/4" />
            </Carousel.Item>
          {/each}
        </Carousel.Content>
      </Carousel.Root>
      {#if hasUserPostedToday}
        <Reaction bind:post class="absolute bottom-2 right-2 z-10" />
      {:else}
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <p class="text-xl font-bold text-center text-background w-fit">
            {i18n.t('social.post.blurred')}
          </p>
        </div>
      {/if}

      {#if post.images.length > 1}
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

  <div class="p-2 flex flex-col rounded-lg gap-4 relative bg-card mt-6">
    {#each post.comments as c (c.id)}
      {@render comment(c)}
    {:else}
      <p class="text-center text-sm text-muted-foreground">
        {i18n.t('social.post.comments.noComments')}
      </p>
    {/each}
    <Button
      class={cn(post.comments.length === 0 && 'mx-auto')}
      onclick={() => (newComment.open = true)}
    >
      <Plus class="size-4" />
      {i18n.t('social.post.comments.addComment.button')}
    </Button>
  </div>
</section>
