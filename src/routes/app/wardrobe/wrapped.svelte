<script lang="ts">
  import { page } from '$app/state';
  import { Spinner } from '$lib/components';
  import { Button } from '$lib/components/ui/button';
  import i18n from '$lib/i18n';
  import type { Wrapped } from '$lib/server/db/wrapped';
  import { ArrowRight } from '@lucide/svelte';
  import { fade, scale } from 'svelte/transition';

  let hasWrapped = $derived(page.data.wrappedAvailable);
  let open = $state(true);
  let loading = $state(false);
  let wrapped = $state<Wrapped | null>(null);

  async function getWrapped() {
    const res = await fetch('/api/wardrobe/wrapped');
    if (res.ok) {
      const data = await res.json();
      wrapped = data.wrapped;
    }
    return null;
  }

  $effect(() => {
    if (open && !wrapped) {
      loading = true;
      getWrapped().finally(() => {
        loading = false;
      });
    }
  });
</script>

{#if open}
  <div class="fixed inset-0 z-50 bg-background" transition:scale>
    <div class="relative size-full flex flex-col p-4">
      {#if loading}
        <div
          class="absolute top-1/2 left-1/2 -transition-x-1/2 -transition-y-1/2"
          transition:fade={{ duration: 300 }}
        >
          <Spinner class="size-8" />
        </div>
      {:else}
        <div class="grow"></div>
        <Button class="flex flex-row gap-2">
          <ArrowRight class="rtl:rotate-180" />
        </Button>
      {/if}
    </div>
  </div>
{/if}

{#if hasWrapped}
  <div class="p-2 w-full flex flex-col">
    <Button onclick={() => (open = true)}>
      {i18n.t('wrapped.cta')}
    </Button>
  </div>
{/if}
