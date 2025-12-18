<script lang="ts">
  import { type Publication, reactions, type Reactions, UUID } from '$lib/types';
  import { slide } from 'svelte/transition';
  import { cn, logger } from '$lib/utils';
  import { Toaster } from '$lib/components/Toast/toast';
  import i18n from '$lib/i18n';
  import { onMount } from 'svelte';
  import type { SvelteHTMLElements } from 'svelte/elements';
  import { page } from '$app/state';

  interface Props {
    post: Publication;
  }

  let {
    post = $bindable(),
    class: className,
    ...restProps
  }: Props & SvelteHTMLElements['div'] = $props();
  let reactionsOpen = $state<UUID | null>(null);
  let user = $derived(page.data.user);

  const reactionsMap: Record<Reactions, { icon: string; color: string }> = {
    love: { icon: '❤️', color: 'oklch(88.5% 0.062 18.334)' },
    like: { icon: '👍', color: 'oklch(92.4% 0.12 95.746)' },
    haha: { icon: '😂', color: 'oklch(92.4% 0.12 95.746)' },
    wow: { icon: '😮', color: 'oklch(92.4% 0.12 95.746)' },
    sad: { icon: '😢', color: 'oklch(92.4% 0.12 95.746)' },
  };

  async function onReactionClick(reaction: Reactions) {
    try {
      const res = await fetch('/api/social/react', {
        method: 'POST',
        body: JSON.stringify({
          postId: post.id,
          reaction,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const { newReaction, newReactionCounts } = data;
      post.userReaction = newReaction;
      post.reactions = newReactionCounts;
      reactionsOpen = null;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error('Error reacting to post:', msg);
      Toaster.error(msg as any);
      // Revert reaction on error
      post.userReaction = undefined;
    }
  }

  const formatNumber = (number: number) => {
    return new Intl.NumberFormat(i18n.locale, { notation: 'compact' }).format(number);
  };

  function onPageClick(e: MouseEvent) {
    try {
      const target = e.target as HTMLElement;
      if (!target.closest('.reaction-container'))
        throw new Error('Clicked outside reaction container');
      const targetPost = target.closest('[data-post]')?.getAttribute('data-post');
      if (!targetPost) throw new Error('Clicked outside reaction container');
      reactionsOpen = targetPost;
    } catch {
      reactionsOpen = null;
    }
  }

  onMount(() => {
    document.addEventListener('click', onPageClick);
    return () => {
      document.removeEventListener('click', onPageClick);
    };
  });
</script>

{#if user?.id !== post.user.id}
  <div
    class={cn(
      'border-2 border-border rounded-full overflow-hidden transition-colors p-0.5 bg-card flex flex-row-reverse items-center reaction-container',
      className
    )}
    style={post.userReaction && reactionsOpen !== post.id
      ? `border-color: ${reactionsMap[post.userReaction].color};`
      : ''}
    {...restProps}
  >
    {#if reactionsOpen === post.id}
      <div
        class="flex flex-row items-center gap-1 overflow-hidden transition-all duration-300"
        transition:slide={{ axis: 'x', duration: 200 }}
      >
        {#key post.userReaction}
          {#each reactions as reaction (reaction)}
            {@const isReaction = reaction === post.userReaction}
            <button
              class="py-0.5 px-1 border flex flex-row gap-1 relative items-center justify-center border-border rounded-full h-8 transition-colors"
              onclick={() => onReactionClick(reaction)}
              style={isReaction ? `background-color: ${reactionsMap[reaction].color};` : ''}
            >
              <span>{reactionsMap[reaction].icon}</span>
              <span class={cn('text-xs', isReaction ? 'text-background' : 'text-foreground')}
                >{formatNumber(post.reactions[reaction])}</span
              >
            </button>
          {/each}
        {/key}
      </div>
    {:else}
      <button
        class={cn('size-8 p-0.5 rounded-full')}
        transition:slide={{ axis: 'x', duration: 100 }}
      >
        {reactionsMap[post.userReaction ?? reactions[0]].icon}
      </button>
    {/if}
  </div>
{/if}
