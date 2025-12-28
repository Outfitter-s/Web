<script lang="ts">
  import { page } from '$app/state';
  import { Button } from '$lib/components/ui/button';
  import i18n from '$lib/i18n';
  import { House, Plus, Rss, Shirt, User } from '@lucide/svelte';
  import { itemOpen } from '$lib/components/routes/app/nav';
  import type { Component } from 'svelte';
  import { cn, DateUtils } from '$lib/utils';
  import type { Outfit } from '$lib/types';
  import { fly } from 'svelte/transition';
  import { backInOut } from 'svelte/easing';
  import Globals from '$lib/globals.svelte';

  interface Link {
    id: string;
    href?: string;
    onClick?: () => void;
    text: string;
    routes?: string[];
    icon?: Component;
    alert?: () => boolean;
  }
  let user = $derived<User | undefined>(page.data.user);

  let links = $derived<Link[]>([
    ...(user
      ? [
          {
            href: '/app',
            id: 'app',
            text: i18n.t('nav.home'),
            routes: ['/app'],
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
          {
            id: 'feed',
            href: '/app/feed',
            routes: ['/app/feed*', '/app/[username]'],
            text: i18n.t('nav.feed'),
            icon: Rss,
          },
          {
            id: 'add-item',
            text: i18n.t('nav.outfits'),
            icon: Plus,
            onClick: () => ($itemOpen = !$itemOpen),
          },
          {
            id: 'wardrobe',
            href: '/app/wardrobe',
            routes: ['/app/wardrobe*'],
            text: i18n.t('nav.wardrobe'),
            icon: Shirt,
          },
          {
            id: 'account',
            href: '/app/account',
            routes: ['/app/account*'],
            text: i18n.t('nav.account'),
            icon: User,
          },
        ]
      : [
          { id: 'home', routes: ['/'], href: '/', text: i18n.t('nav.home') },
          { id: 'about', routes: ['/#about'], href: '/#about', text: i18n.t('nav.about') },
          {
            id: 'sign-up',
            routes: ['/auth/sign-up'],
            href: '/auth/sign-up',
            text: i18n.t('nav.signUp'),
          },
          {
            id: 'log-in',
            routes: ['/auth/log-in'],
            href: '/auth/log-in',
            text: i18n.t('nav.logIn'),
          },
        ]),
  ]);

  const removeLayoutsInRoute = (route: string) => {
    if (!route) return '/';
    // Remove anything in parentheses between slashes
    const reg = new RegExp('/\\([^/]+\\)', 'g');
    const cleaned = route.replace(reg, '');
    // If result is empty or just '/', return '/'
    return cleaned === '' ? '/' : cleaned;
  };

  const routeMatches = (routes: string[] | undefined, activeRoute: string) => {
    if (!routes) return false;
    return routes.some((route) => {
      if (route.endsWith('*')) {
        const baseRoute = route.slice(0, -1);
        return activeRoute.startsWith(baseRoute);
      }
      return activeRoute === route;
    });
  };

  let activeRoute = $derived<string>(
    removeLayoutsInRoute(page.route.id ?? '/') + (page.url.hash || '')
  );
</script>

{#snippet alertDot()}
  <div class="absolute top-0 right-0 -translate-x-full translate-y-full size-2">
    <div class="absolute inset-0 bg-destructive rounded-full animate-ping"></div>
    <div class="absolute inset-0 bg-destructive rounded-full"></div>
  </div>
{/snippet}

<div class="fixed right-0 bottom-0 left-0 p-4 z-10 w-full overflow-hidden">
  {#if Globals.nav.shown || Globals.navComponentReplacement}
    <nav class="pt-0 w-full" transition:fly={{ y: 100, duration: 500, easing: backInOut }}>
      <div
        class="max-w-250 overflow-hidden shadow relative h-16 rounded-full p-2 bg-foreground dark:bg-secondary w-full mx-auto"
      >
        {#if Globals.navComponentReplacement}
          <div
            class="w-full h-full"
            in:fly={{ duration: 300, y: '100%' }}
            out:fly={{ duration: 300, y: '-100%' }}
          >
            {@render Globals.navComponentReplacement()}
          </div>
        {:else}
          <div
            class="flex flex-row justify-between w-full h-full items-center gap-2"
            in:fly={{ duration: 300, y: '100%' }}
            out:fly={{ duration: 300, y: '-100%' }}
          >
            {#each links as link (link.id)}
              {@const active = routeMatches(link.routes, activeRoute)}
              <Button
                variant="none"
                href={link.href}
                onclick={link.onClick}
                class={cn(
                  'before:rounded-full before:absolute before:transition-transform relative dark:before:bg-primary h-12 before:bg-background before:inset-0 font-mono items-center',
                  user ? 'w-12 px-2' : ' px-4',
                  active
                    ? 'before:scale-100 text-primary dark:text-background'
                    : 'before:scale-0 text-background dark:text-foreground'
                )}
              >
                {#if link.icon}
                  <!-- svelte-ignore svelte_component_deprecated -->
                  <svelte:component this={link.icon} class="z-10 size-full" />
                {:else}
                  <span class="z-10">{@html link.text}</span>
                {/if}
                {#if link?.alert && link.alert()}
                  {@render alertDot()}
                {/if}
              </Button>
            {/each}
          </div>
        {/if}
      </div>
    </nav>
  {/if}
</div>
