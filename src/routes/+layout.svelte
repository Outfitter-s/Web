<script lang="ts">
  import '../app.css';
  import { SEO, Toaster } from '$lib/components';
  import Navbar from './navbar.svelte';
  import Globals from '$lib/globals.svelte';
  import AddItem from '$lib/components/routes/app/nav/add_item.svelte';
  import { page } from '$app/state';
  import NavBack from '$lib/components/NavBack.svelte';

  let { children, data } = $props();

  $effect(() => {
    Globals.theme = data.theme;
    Globals.navBack.shown = page.url.pathname.startsWith('/app');
  });
</script>

<SEO title="seo.defaults.title" description="seo.defaults.description" />

<Toaster />

<!-- Nav modal to add a new item to wardrobe -->
<!-- Needs to be at the top level layout because it can be opened by anyone in the component tree. -->
<!-- The API is restricted to authenticated users so there is not issue -->
<AddItem />

<div class="flex min-h-dvh flex-col">
  <NavBack />
  <main class="flex grow flex-col w-full relative pb-24">
    <svelte:boundary>{@render children()}</svelte:boundary>
  </main>
  <Navbar />
</div>
