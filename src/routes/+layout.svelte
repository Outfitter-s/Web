<script lang="ts">
  import '../app.css';
  import { SEO, Toaster } from '$lib/components';
  import Navbar from './navbar.svelte';
  import Globals from '$lib/globals.svelte';
  import { onMount } from 'svelte';
  import AddItem from '$lib/components/routes/app/nav/add_item.svelte';

  let { children, data } = $props();

  onMount(() => {
    Globals.theme = data.theme;
  });
</script>

<SEO title="seo.defaults.title" description="seo.defaults.description" />

<Toaster />

<!-- Nav modal to add a new item to wardrobe -->
<!-- Needs to be at the top level layout because it can be opened by anyone in the component tree. -->
<!-- The API is restricted to authenticated users so there is not issue -->
<AddItem />

<div class="flex h-dvh flex-col overflow-hidden bg-card p-2 pb-0">
  <div class="flex grow rounded-xl flex-col overflow-y-auto bg-background no-scrollbar">
    <svelte:boundary>{@render children()}</svelte:boundary>
  </div>
  <Navbar />
</div>
