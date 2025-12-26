<script lang="ts">
  import { page } from '$app/state';
  import Globals from '$lib/globals.svelte';
  import i18n from '$lib/i18n';

  interface Props {
    title: Parameters<typeof i18n.t>[0] | string;
    description?: Parameters<typeof i18n.t>[0] | string;
    image?: string;
  }

  let {
    title = 'seo.defaults.title',
    description = 'seo.defaults.description',
    image = '/favicon.ico',
  }: Props = $props();
  let derivedTitle = $derived(i18n.t(title as any) + ' | ' + i18n.t('seo.titleSuffix'));
  let derivedDescription = $derived(i18n.t(description as any));
  $effect(() => {
    Globals.pageTitle = i18n.t(title as any);
  });
</script>

<svelte:head>
  <!-- Title -->
  <title>{derivedTitle}</title>
  <meta property="og:title" content={derivedTitle} />
  <meta name="twitter:title" content={derivedTitle} />

  <!-- Description -->
  <meta name="description" content={derivedDescription} />
  <meta property="og:description" content={derivedDescription} />
  <meta name="twitter:description" content={derivedDescription} />

  <!-- Image -->
  <meta property="og:image" content={image} />
  <meta name="twitter:image" content={image} />
  <link rel="icon" href={image} />

  <!-- URL -->
  <meta property="og:url" content={page.url.href} />
  <meta name="twitter:url" content={page.url.href} />

  <!-- Others -->
  <meta property="og:type" content="website" />
</svelte:head>
