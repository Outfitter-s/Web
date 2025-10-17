<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import { Button } from '$lib/components/ui/button';
  import { t } from '$lib/i18n';
</script>

<div class="flex w-full grow flex-col items-center justify-center gap-2">
  <h1 class="font-mono font-bold" style="font-size: 7rem;">{page.status}</h1>
  {#if page.error?.message}
    <p class="text-muted-foreground text-base">{$t(page.error.message)}</p>
  {/if}

  {#if browser && 'history' in window && window.history.length > 1}
    <Button
      onclick={() => {
        window.history.back();
      }}>{$t('errorPage.cta.goBack')}</Button
    >
  {:else}
    <Button href="/">{$t('errorPage.cta.goHome')}</Button>
  {/if}
</div>
