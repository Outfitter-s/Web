<script lang="ts">
  import Footer from './Footer.svelte';

  let { children } = $props();
</script>

<div class="min-h-[calc(100svh-var(--spacing)*14)] flex flex-col">
  {@render children()}
</div>

<Footer />
