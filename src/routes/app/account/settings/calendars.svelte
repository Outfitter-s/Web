<script lang="ts">
  import { browser } from '$app/environment';
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import { Toaster } from '$lib/components/Toast/toast';
  import { Button } from '$lib/components/ui/button';
  import i18n from '$lib/i18n';
  import type { ICSToken } from '$lib/types';
  import { copyToClipboard, logger } from '$lib/utils';
  import { Trash2 } from '@lucide/svelte';

  let rows = $derived<ICSToken[]>(page.data.rows);
  let isDeletingRowId = $state<ICSToken['id'] | null>(null);
  let isCreatingToken = $state(false);

  async function resetTokens() {
    await invalidateAll();
  }

  $effect(() => {
    if (page?.form && ['createToken', 'revokeToken'].includes(page.form.action)) {
      if (page.form.success) {
        Toaster.success(page.form.message);
        resetTokens();
      } else {
        logger.error(page.form.message);
        Toaster.error(page.form.message);
      }
    }
  });

  const buildCalendarUrl = (token: ICSToken['id']) => {
    const origin = new URL(browser ? location.origin : 'http://localhost');
    return `${origin}api/calendars/events.ics?locale=${i18n.locale}&token=${token}`;
  };

  const copyToken = (token: ICSToken['id']) => {
    copyToClipboard(buildCalendarUrl(token));
    Toaster.success('successes.ics.copied');
  };
</script>

<div class="flex flex-col gap-2">
  {#each rows as row}
    <form
      method="POST"
      class="flex flex-row gap-2"
      action="?/revokeToken"
      use:enhance={(e) => {
        e.formData.append('tokenId', row.id);
        isDeletingRowId = row.id;
        return async ({ update }) => {
          update({ reset: false });
          isDeletingRowId = null;
        };
      }}
    >
      <button type="button" class="grow text-start" onclick={() => copyToken(row.id)}>
        <span class="max-w-full line-clamp-1 wrap-break-word underline">
          {buildCalendarUrl(row.id)}
        </span>
      </button>
      <Button
        variant="destructive"
        size="icon"
        type="submit"
        loading={isDeletingRowId === row.id}
        disabled={!!isDeletingRowId}
        aria-label={i18n.t('account.settings.tabs.calendars.revokeButton')}
        class="p-2 shrink-0"
      >
        <Trash2 class="size-full" /></Button
      >
    </form>
  {/each}
</div>

<form
  method="POST"
  class="flex flex-row"
  action="?/createToken"
  use:enhance={() => {
    isCreatingToken = true;
    return async ({ update }) => {
      update({ reset: false });
      isCreatingToken = false;
    };
  }}
>
  <Button variant="default" loading={isCreatingToken} disabled={isCreatingToken} type="submit">
    {i18n.t('account.settings.tabs.calendars.createButton')}
  </Button>
</form>
