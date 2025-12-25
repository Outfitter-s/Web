<script lang="ts">
  import { page } from '$app/state';
  import { Button } from '$lib/components/ui/button';
  import i18n from '$lib/i18n';
  import { House, Plus, Rss, Shirt, User } from '@lucide/svelte';
  import { itemOpen } from '$lib/components/routes/app/nav';
  import { slide } from 'svelte/transition';
  import type { Component } from 'svelte';
  import { DateUtils } from '$lib/utils';
  import type { Outfit } from '$lib/types';

  interface Link {
    href: string;
    text: string;
    icon?: Component;
    alert?: () => boolean;
  }
  let user = $derived<User | undefined>(page.data.user);

  let links = $derived<Link[]>([
    ...(user
      ? [
          {
            href: '/app',
            text: i18n.t('nav.home'),
            icon: House,
            alert: () => {
              if (!user) return false;
              const today = new Date();
              const hasTodayOutfit = ((page.data.outfits as Outfit[]) || []).some((outfit) =>
                DateUtils.isSameDay(outfit.createdAt, today)
              );
              return !hasTodayOutfit;
            },
          },
          { href: '/app/feed', text: i18n.t('nav.feed'), icon: Rss },
          { href: 'add-item', text: i18n.t('nav.outfits') },
          { href: '/app/wardrobe', text: i18n.t('nav.wardrobe'), icon: Shirt },
          { href: '/app/account', text: i18n.t('nav.account'), icon: User },
        ]
      : [
          { href: '/', text: i18n.t('nav.home') },
          { href: '/#about', text: i18n.t('nav.about') },
          { href: '/auth/sign-up', text: i18n.t('nav.signUp') },
          { href: '/auth/log-in', text: i18n.t('nav.logIn') },
        ]),
  ]);
</script>

{#snippet alertDot()}
  <div class="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 size-2">
    <div class="size-full relativ">
      <div class="absolute inset-0 bg-destructive rounded-full animate-ping"></div>
      <div class="absolute inset-0 bg-destructive rounded-full"></div>
    </div>
  </div>
{/snippet}

<nav class="sticky right-0 bottom-0 left-0 z-10 h-14 shrink-0 grid w-fullpx-2">
  <div
    class="max-w-250 grid w-full justify-center items-center gap-2 mx-auto"
    style="grid-template-columns: repeat({links.length}, 1fr);"
  >
    {#each links as link (link.href)}
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
          <div class="relative">
            {#if link.icon}
              <!-- svelte-ignore svelte_component_deprecated -->
              <svelte:component this={link.icon} class="z-10 size-5" />
            {:else}
              <span class="z-10 ltr:ml-2 rtl:mr-2" transition:slide={{ duration: 300, axis: 'x' }}
                >{@html link.text}</span
              >
            {/if}
            {#if link?.alert && link.alert()}
              {@render alertDot()}
            {/if}
          </div>
        </Button>
      {/if}
    {/each}
  </div>
</nav>
