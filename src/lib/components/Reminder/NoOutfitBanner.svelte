<script lang="ts">
  import { DateUtils } from '$lib/utils';
  import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert';
  import { Button } from '$lib/components/ui/button';
  import i18n from '$lib/i18n';
  import { fly } from 'svelte/transition';
  import Warning from '$lib/components/Reminder/warning.svelte';

  interface Props {
    user: any;
    outfits: any[];
  }

  const { user, outfits }: Props = $props();

  let visible = $state(false);
  let key = '';

  $effect(() => {
    if (!user) return;
    if (typeof sessionStorage === 'undefined') return;

    key = `no_outfit_reminder_${user.id}_${new Date().toISOString().slice(0, 10)}`;

    const hasToday = Array.isArray(outfits) && outfits.find((o) => DateUtils.isToday(o.createdAt));
    if (!hasToday && sessionStorage.getItem(key) !== '1') {
      visible = true;
    }
  });

  function dismiss() {
    if (typeof sessionStorage !== 'undefined' && key) sessionStorage.setItem(key, '1');
    visible = false;
  }
</script>

{#if visible}
  <div class="mx-auto w-full max-w-10xl px-4 h-auto" in:fly={{ y: -8, duration: 300 }}>
    <div
      class="mb-4 flex items-center justify-center rounded-lg border border-[#411618] bg-[#2A1314] p-4 shadow-sm text-[#D55256]"
    >
      <div
        class="flex text-center gap-10 leading-6 flex-col md:flex-row items-center justify-center"
      >
        <div class="flex text-center gap-2">
          <Warning />
          <AlertTitle class="font-semibold">
            {i18n.t('wardrobe.reminder.title')}
          </AlertTitle>
        </div>
        <AlertDescription class="text-[#D55256]">
          {i18n.t('wardrobe.reminder.noTodayOutfit')}
        </AlertDescription>

        <Button href="/app" variant="ghost" size="sm"
          >{i18n.t('wardrobe.reminder.createButton')}</Button
        >
      </div>
      <!--<Button variant="ghost" size="sm" on:click={dismiss} >{i18n.t('wardrobe.reminder.close')}</Button>-->
    </div>
  </div>
{/if}
