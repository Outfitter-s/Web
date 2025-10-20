<script lang="ts">
  import { page } from '$app/state';
  import { Button } from '$lib/components/ui/button';
  // import { t } from '$lib/i18n';
  import { Home, Plus, Shirt, User } from '@lucide/svelte';
  import AddButton from '$lib/components/routes/app/nav/addButton.svelte';
  // import { slide } from 'svelte/transition';

  let addOpen = $state(false);

  interface Link {
    href: string;
    text: string;
    icon?: typeof Home;
  }

  let links = $derived<Link[]>([
    ...(page.data?.user
      ? [
          { href: '/app', text: 'nav.home', icon: Home },
          { href: '', text: 'Placeholder' },
          { href: 'add-item', text: 'nav.outfits' },
          { href: '/app/wardrobe', text: 'nav.wardrobe', icon: Shirt },
          { href: '/app/account', text: 'nav.account', icon: User },
        ]
      : [
          { href: '/', text: 'nav.home' },
          { href: '/#about', text: 'nav.about' },
          { href: '/#pricing', text: 'nav.pricing' },
          { href: '/auth/sign-up', text: 'nav.signUp' },
          { href: '/auth/log-in', text: 'nav.logIn' },
        ]),
  ]);

  // const pathMatches = (path: string) => {
  //   return page.url.pathname === path;
  // };
</script>

<AddButton bind:open={addOpen} />

{#snippet entry(link: Link)}
  {#if link.href == 'add-item'}
    <Button
      variant="none"
      onclick={() => (addOpen = !addOpen)}
      class=" border-border bg-card z-10 mx-auto -mt-6 size-14 rounded-full border p-2 shadow-xl"
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
      {/if}
      <!-- {#if pathMatches(link.href)}
        <span class="z-10 ltr:ml-2 rtl:mr-2" transition:slide={{ duration: 300, axis: 'x' }}
          >{$t(link.text)}</span
        >
      {/if} -->
    </Button>
  {/if}
{/snippet}

<nav
  class="fixed right-0 bottom-0 left-0 z-10 flex h-16 w-full shrink-0 flex-row items-center justify-center p-2"
>
  <div
    class="border-border bg-card grid h-full w-full max-w-[1000px] items-center gap-2 rounded-lg border px-2"
    style="grid-template-columns: repeat({links.length}, 1fr);"
  >
    {#each links as l}
      {@render entry(l)}
    {/each}
  </div>
</nav>
