<script lang="ts">
  import { resolve } from '$app/paths';
  import i18n from '$lib/i18n';
  import { ProfilePicture } from '$lib/components/social';
  import { Button } from '$lib/components/ui/button';
  import { DateUtils, logger } from '$lib/utils';
  import type { CarouselAPI } from '$lib/components/ui/carousel/context';
  import type { Comment as CommentType } from '$lib/types';
  import { page } from '$app/state';
  import CommentComponent from './Comment.svelte';
  import { Pen, Save, Trash2 } from '@lucide/svelte';
  import { invalidateAll } from '$app/navigation';
  import { Toaster } from '$lib/components/Toast/toast';
  import { scale } from 'svelte/transition';
  import { Textarea } from '$lib/components/ui/textarea';

  interface Props {
    comment: CommentType;
  }

  let { comment }: Props = $props();
  let user = $derived(page.data.user);
  let carouselCurrentIndex = $state(0);
  let carouselApi = $state<CarouselAPI>();
  let newComment = $state<{
    open: boolean;
    processing: boolean;
    commentId: null | CommentType['id'];
  }>({
    open: false,
    processing: false,
    commentId: null,
  });
  let isDeletingComment = $state<boolean>(false);
  let editedComment = $state<{
    open: boolean;
    processing: boolean;
    commentId: null | CommentType['id'];
    content: string;
  }>({
    open: false,
    processing: false,
    commentId: null,
    content: '',
  });

  $effect(() => {
    if (carouselApi) {
      carouselCurrentIndex = carouselApi.selectedScrollSnap() + 1;
      carouselApi.on('select', () => {
        carouselCurrentIndex = carouselApi!.selectedScrollSnap() + 1;
      });
    }
  });

  async function deleteComment() {
    isDeletingComment = true;
    try {
      const response = await fetch(`/api/social/comment?commentId=${comment.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(`Failed to delete comment: ${response.statusText}`);
      await invalidateAll();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      Toaster.error(msg as any);
      logger.error('Error deleting comment:', error);
    } finally {
      isDeletingComment = false;
    }
  }

  async function editComment() {
    if (!editedComment.content.trim()) {
      Toaster.error('errors.social.post.comment.emptyContent');
      return;
    }
    editedComment.processing = true;
    try {
      const response = await fetch(`/api/social/comment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editedComment.commentId,
          content: editedComment.content,
        }),
      });
      if (!response.ok) throw new Error(`Failed to edit comment: ${response.statusText}`);
      await invalidateAll();
      editedComment.open = false;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      Toaster.error(msg as any);
      logger.error('Error editing comment:', error);
    } finally {
      editedComment.processing = false;
    }
  }
</script>

<div class="flex flex-col">
  <div class="flex flex-row gap-2">
    <ProfilePicture userId={comment.user.id} class="size-8 shrink-0" />
    <div class="flex flex-col grow">
      <a
        href={resolve('/app/[username]', { username: `@${comment.user.username}` })}
        class="font-medium text-xs">{comment.user.username}</a
      >
      {#if editedComment.open}
        <Textarea
          bind:value={editedComment.content}
          class="w-full"
          rows={3}
          disabled={editedComment.processing}
        />
      {:else}
        <p class="text-base font-normal wrap-normal">{comment.content}</p>
      {/if}
      <div class="flex flex-row gap-2 items-center">
        <span class="text-xs text-muted-foreground">{DateUtils.formatDate(comment.createdAt)}</span>
        <Button
          variant="link"
          size="sm"
          onclick={() => {
            newComment.commentId = comment.id;
            newComment.open = true;
          }}
        >
          {i18n.t('social.post.comments.reply.button')}
        </Button>
      </div>
    </div>
    {#if user.id === comment.user.id}
      <div class="shrink-0 flex flex-cl gap-2">
        <Button
          size="icon"
          class="size-6 p-1"
          onclick={() => {
            if (editedComment.open) {
              editComment();
            } else {
              editedComment.open = !editedComment.open;
              editedComment.commentId = comment.id;
              editedComment.content = comment.content;
            }
          }}
          disabled={editedComment.processing}
          loading={editedComment.processing}
        >
          {#if editedComment.open}
            <span in:scale={{ duration: 300 }}>
              <Save class="size-4" />
            </span>
          {:else}
            <span in:scale={{ duration: 300 }}>
              <Pen class="size-4" />
            </span>
          {/if}
        </Button>
        <Button
          size="icon"
          variant="destructive"
          class="size-6 p-1"
          loading={isDeletingComment}
          disabled={isDeletingComment}
          onclick={deleteComment}
        >
          <Trash2 class="size-4" />
        </Button>
      </div>
    {/if}
  </div>
  <!-- Replies -->
  {#if comment.replies.length > 0}
    <div class="flex flex-col mt-4 pl-4 ml-4 border-l border-border gap-4">
      {#each comment.replies as reply (reply.id)}
        <CommentComponent comment={reply} />
      {/each}
    </div>
  {/if}
</div>
