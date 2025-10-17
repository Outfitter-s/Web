<script lang="ts">
  import '../app.css';
  import { SEO, Toaster } from '$lib/components';
  import { t } from '$lib/i18n';
  import { ModeWatcher } from 'mode-watcher';
  import Navbar from './navbar.svelte';

  let { children } = $props();
</script>

<SEO title={$t('seo.defaults.title')} description={$t('seo.defaults.description')} />

<ModeWatcher />

<Toaster />

<div class="flex min-h-dvh flex-col">
  <div class="flex grow flex-col">
    <svelte:boundary>{@render children()}</svelte:boundary>
  </div>

  <Navbar />
</div>
