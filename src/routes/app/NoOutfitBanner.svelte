<script lang="ts">
  import { DateUtils } from '$lib/utils';
  import { Button } from '$lib/components/ui/button';
  import i18n from '$lib/i18n';
  import { slide } from 'svelte/transition';
  import { page } from '$app/state';
  import { TriangleAlert } from '@lucide/svelte';
  import type { Outfit, User } from '$lib/types';
  import { resolve } from '$app/paths';

  let user = $derived<User>(page.data.user);
  let outfits = $derived<Outfit[]>(page.data.outfits);

  let visible = $state(false);

  $effect(() => {
    if (!user) return;
    const today = new Date();
    const hasTodayOutfit = outfits.some((outfit) => DateUtils.isSameDay(outfit.createdAt, today));
    visible = !hasTodayOutfit;
  });
</script>

{#if visible && page.url.pathname !== '/app'}
  <div transition:slide={{ axis: 'y', duration: 300 }}>
    <div
      class="flex items-center justify-center border-y border-destructive/50 bg-destructive/15 py-3 px-4 text-destructive text-center gap-10 flex-row"
    >
      <TriangleAlert class="size-5" />
      <span class="text-start text-wrap">
        {i18n.t('wardrobe.reminder.noTodayOutfit')}
      </span>

      <Button href={resolve('/app')} variant="default" size="sm"
        >{i18n.t('wardrobe.reminder.createButton')}</Button
      >
    </div>
  </div>
{/if}
