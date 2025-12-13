<script lang="ts">
  import { cn } from '$lib/utils';
  import { CircleCheck, CircleX, TriangleAlert, X, Info } from '@lucide/svelte';
  import { fade } from 'svelte/transition';
  import { Tween } from 'svelte/motion';
  import { onMount } from 'svelte';
  import type { ToastType } from './toast';
  import { Toaster, type Toast } from './toast';
  import i18n from '$lib/i18n';
  import { Button } from '$lib/components/ui/button';

  interface Props {
    toast: Toast;
  }

  const { toast: t }: Props = $props();
  const baseToastClasses =
    'border border-border bg-card text-primary relative p-4 rounded-xl overflow-hidden flex flex-col gap-2';
  let progress = new Tween(0, {
    duration: t.options.timeout || 0,
  });

  const svgs: Record<ToastType, { component: any; color: string }> = {
    error: {
      component: CircleX,
      color: 'text-danger',
    },
    success: {
      component: CircleCheck,
      color: 'text-success',
    },
    warning: {
      component: TriangleAlert,
      color: 'text-warning',
    },
    info: {
      component: Info,
      color: 'text-[#3cbcfb]',
    },
  };

  onMount(() => {
    if (t.options.timeout) progress.set(100);
  });
</script>

<div role="alert" class={baseToastClasses} transition:fade={{ duration: 300 }}>
  <!-- Progress -->
  {#if t.options.timeout}
    <div class="absolute top-0 right-2 left-0 h-[3px]">
      <div class="bg-border h-full" style="width: {progress.current}%;"></div>
    </div>
  {/if}

  <div class="flex flex-col gap-2">
    <div class="item-start flex flex-row gap-2">
      <div class="size-6 shrink-0 p-1">
        <!-- svelte-ignore svelte_component_deprecated -->
        <svelte:component
          this={svgs[t.type].component}
          class={cn('size-full', svgs[t.type].color)}
        />
      </div>

      <!-- Message -->
      <p class="font-base mt-0.5 grow text-sm text-wrap">
        {i18n.t(t.message)}
      </p>

      <!-- Close button -->
      <button
        class="size-6 shrink-0 p-1"
        aria-label="Remove toast"
        onclick={() => Toaster.remove(t.id)}
      >
        <X class="size-full" />
      </button>
    </div>

    <!-- Actions -->
    {#if t.options.actions && t.options.actions.length > 0}
      <div class="flex flex-row gap-2">
        {#each t.options.actions as action (action.label)}
          {#if action.type === 'link'}
            <Button
              href={action.href}
              variant={action.variant || 'default'}
              onclick={() => Toaster.remove(t.id)}
            >
              {i18n.t(action.label)}
            </Button>
          {:else if action.type === 'button'}
            <Button
              class="text-primary hover:underline"
              variant={action.variant || 'default'}
              onclick={() => {
                action.onClick();
                Toaster.remove(t.id);
              }}
            >
              {i18n.t(action.label)}
            </Button>
          {/if}
        {/each}
      </div>
    {/if}
  </div>
</div>
