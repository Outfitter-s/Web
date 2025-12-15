<script lang="ts">
  import { page } from '$app/state';
  import { Button } from '$lib/components/ui/button';
  import i18n from '$lib/i18n';
  import { House, Plus, Rss, Shirt, User } from '@lucide/svelte';
  import { itemOpen } from '$lib/components/routes/app/nav';
  import { slide } from 'svelte/transition';
  import type { Component } from 'svelte';

  interface Link {
    href: string;
    text: string;
    icon?: Component;
  }

  let links = $derived<Link[]>([
    ...(page.data?.user
      ? [
          { href: '/app', text: 'nav.home', icon: House },
          { href: '/app/feed', text: 'nav.feed', icon: Rss },
          { href: 'add-item', text: 'nav.outfits' },
          { href: '/app/wardrobe', text: 'nav.wardrobe', icon: Shirt },
          { href: '/app/account', text: 'nav.account', icon: User },
        ]
      : [
          { href: '/', text: 'nav.home' },
          { href: '/#about', text: 'nav.about' },
          { href: '/auth/sign-up', text: 'nav.signUp' },
          { href: '/auth/log-in', text: 'nav.logIn' },
        ]),
  ]);

  // const pathMatches = (path: string) => {
  //   return page.url.pathname === path;
  // };
</script>

{#snippet entry(link: Link)}
  {#if link.href == 'add-item'}
    <Button
      variant="none"
      onclick={() => ($itemOpen = !$itemOpen)}
      class=" border-border bg-card z-10 mx-auto -translate-y-5 size-14 rounded-full border p-2 shadow-xl"
    >
      <Plus class="size-full" />
    </Button>
  {:else}
    <Button
      variant="none"
      href={link.href}
      class="dark:before:bg-accent before:bg-border px-4 font-mono before:absolute before:inset-0 before:z-0 before:scale-0 before:rounded-xs before:transition-all hover:before:scale-100 active:before:scale-100"
    >
      {#if link.icon}
        <!-- svelte-ignore svelte_component_deprecated -->
        <svelte:component this={link.icon} class="z-10 size-5" />
      {:else}
        <span class="z-10 ltr:ml-2 rtl:mr-2" transition:slide={{ duration: 300, axis: 'x' }}
          >{i18n.t(link.text as any)}</span
        >
      {/if}
    </Button>
  {/if}
{/snippet}

<nav
  class="fixed right-0 bottom-0 left-0 z-10 h-14 shrink-0 border-border bg-card grid w-full border-t px-2"
>
  <div
    class="max-w-250 grid w-full justify-center items-center gap-2 mx-auto"
    style="grid-template-columns: repeat({links.length}, 1fr);"
  >
    {#each links as l}
      {@render entry(l)}
    {/each}
  </div>
</nav>
