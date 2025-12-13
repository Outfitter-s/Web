<script lang="ts">
  import { page } from '$app/state';
  import i18n from '$lib/i18n';
  import { pageTitle } from '.';

  interface Props {
    title?: string;
    description?: string;
    image?: string;
  }

  let {
    title = '',
    description = i18n.t('seo.defaults.description'),
    image = '/favicon.ico',
  }: Props = $props();
  let derivedTitle = $derived(title + ' | ' + i18n.t('seo.titleSuffix'));

  $effect(() => {
    pageTitle.set(title);
  });
</script>

<svelte:head>
  <!-- Title -->
  <title>{title}</title>
  <meta property="og:title" content={derivedTitle} />
  <meta name="twitter:title" content={derivedTitle} />

  <!-- Description -->
  <meta name="description" content={description} />
  <meta property="og:description" content={description} />
  <meta name="twitter:description" content={description} />

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
