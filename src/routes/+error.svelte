<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import { Button } from '$lib/components/ui/button';
  import i18n from '$lib/i18n';
  import { SEO } from '$lib/components';
  import { resolve } from '$app/paths';
</script>

<SEO
  title={(page.error?.message as any) || 'seo.defaults.error.title'}
  description="seo.defaults.error.description"
/>

<div class="flex w-full grow flex-col items-center justify-center gap-2">
  <h1 class="font-mono font-bold" style="font-size: 7rem;">{page.status}</h1>
  {#if page.error?.message}
    <p class="text-muted-foreground text-base">{i18n.t(page.error.message as any)}</p>
  {/if}

  {#if browser && 'history' in window && window.history.length > 1}
    <Button
      onclick={() => {
        window.history.back();
      }}>{i18n.t('errorPage.cta.goBack')}</Button
    >
  {:else}
    <Button href={resolve('/')}>{i18n.t('errorPage.cta.goHome')}</Button>
  {/if}
</div>
