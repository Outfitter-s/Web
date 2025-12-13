<script lang="ts">
  import '../app.css';
  import { SEO, Toaster } from '$lib/components';
  import i18n from '$lib/i18n';
  import Navbar from './navbar.svelte';
  import Globals from '$lib/globals.svelte';
  import { onMount } from 'svelte';
  import AddItem from '$lib/components/routes/app/nav/add_item.svelte';

  let { children, data } = $props();

  onMount(() => {
    Globals.theme = data.theme;
  });
</script>

<SEO title={i18n.t('seo.defaults.title')} description={i18n.t('seo.defaults.description')} />

<Toaster />

<!-- Nav modal to add a new item to wardrobe -->
<!-- Needs to be at the top level layout because it can be opened by anyone in the component tree. -->
<!-- The API is restricted to authenticated users so there is not issue -->
<AddItem />

<div class="flex min-h-dvh flex-col">
  <div class="flex grow flex-col">
    <svelte:boundary>{@render children()}</svelte:boundary>
  </div>

  <Navbar />
</div>
