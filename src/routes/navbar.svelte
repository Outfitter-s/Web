<script lang="ts">
  import { page } from '$app/state';
  import { Button } from '$lib/components/ui/button';
  import { t } from '$lib/i18n';

  interface Link {
    href: string;
    text: string;
  }

  let links = $derived<Link[]>([
    ...(page.data?.user
      ? [
          { href: '/app', text: 'nav.outfits' },
          { href: '/app/account', text: 'nav.account' },
          { href: '/app/wardrobe', text: 'nav.wardrobe' },
        ]
      : [
          { href: '/', text: 'nav.home' },
          { href: '/#about', text: 'nav.about' },
          { href: '/#pricing', text: 'nav.pricing' },
          { href: '/auth/sign-up', text: 'nav.signUp' },
          { href: '/auth/log-in', text: 'nav.logIn' },
        ]),
  ]);
</script>

{#snippet entry(link: Link)}
  <Button
    variant="none"
    href={link.href}
    class="before:acale-0 dark:before:bg-accent before:bg-border px-4 font-mono before:absolute before:inset-0 before:z-0 before:scale-0 before:rounded-xs before:transition-all hover:before:scale-100 active:before:scale-100"
    ><span class="z-10">{$t(link.text)}</span></Button
  >
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
