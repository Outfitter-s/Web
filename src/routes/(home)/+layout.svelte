<script lang="ts">
  import Footer from './Footer.svelte';

  let { children } = $props();
</script>

<div class="grow flex flex-col">
  {@render children()}
</div>

<Footer />
