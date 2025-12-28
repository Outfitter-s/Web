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

  const indicators: Record<string, { path: string; viewBox: string }> = {
    app: {
      path: `M111.766769,63.265259 C118.762024,71.749290 119.108978,73.246719 111.987701,80.797691 C106.971191,86.116913 105.729431,92.211296 105.348335,98.945038 C104.974213,105.555687 102.747330,108.088058 96.250893,108.298790 C88.080544,108.563820 81.163528,110.846245 75.409271,117.102676 C71.508568,121.343773 68.127373,120.978500 63.475681,117.416969 C63.211239,117.214493 62.916458,117.032265 62.705814,116.781738 C57.373421,110.439674 50.300461,108.569885 42.336117,108.281181 C36.089928,108.054756 33.710197,106.114311 33.522160,99.773750 C33.265385,91.115570 30.428520,84.213737 24.308998,78.054176 C20.281097,73.999916 20.518175,70.279480 24.597279,66.110588 C30.096550,60.490273 33.203491,54.491096 33.218548,46.284496 C33.232769,38.535179 36.083176,35.996582 44.320614,36.044178 C51.632751,36.086430 56.958794,33.458595 61.959534,28.511442 C67.212074,23.315186 70.929016,23.198820 76.282188,28.229691 C81.615944,33.242306 87.130562,36.175220 94.820213,36.104065 C102.931335,36.029003 104.873245,38.798851 105.378731,46.774895 C105.760406,52.797501 106.293434,58.795418 111.766769,63.265259 z`,
      viewBox: `21 24 97 97`,
    },
    account: {
      path: `M35.397194,80.512634 C36.578300,69.650955 37.510639,59.216286 38.791885,48.824635 C39.904007,39.804699 46.671665,33.816864 55.829666,33.744099 C72.488029,33.611732 89.149406,33.590431 105.807243,33.754719 C117.015228,33.865257 123.953415,41.070366 123.431984,52.194775 C122.621925,69.476868 120.484520,86.649666 118.255554,103.793633 C117.133812,112.421417 110.439796,118.163353 101.747955,118.243065 C84.756844,118.398895 67.762131,118.410622 50.771191,118.246437 C40.367123,118.145905 33.782978,111.158081 33.654366,100.831108 C33.571095,94.144829 34.651985,87.573769 35.397194,80.512634 z`,
      viewBox: `33 33 91 86`,
    },
    wardrobe: {
      path: `M18.793598,54.749290 C18.997618,43.067936 23.723408,34.639984 33.641514,28.932320 C38.523201,26.123009 42.812088,22.302073 47.492821,19.120766 C54.576233,14.306452 61.906963,14.182940 68.975937,18.998335 C75.991768,23.777531 83.117485,28.511744 89.483299,34.079422 C92.636383,36.837173 95.286499,41.166420 96.240242,45.235603 C98.245895,53.792847 99.229767,62.621166 100.168861,71.387947 C101.114372,80.214722 97.439178,86.470886 89.357368,90.333397 C81.701035,93.992538 73.919716,97.394249 66.150116,100.810837 C61.018448,103.067444 55.790054,103.106689 50.633644,100.836418 C43.017921,97.483376 35.372139,94.189812 27.846737,90.642685 C18.814983,86.385536 15.273350,79.534218 16.637865,69.513962 C17.289303,64.730171 18.033676,59.959026 18.793598,54.749290 z`,
      viewBox: `16 15 85 88`,
    },
    feed: {
      path: `M66.583504,27.481339 C71.443558,28.052778 75.539993,26.863844 79.573402,25.112139 C90.209129,20.493052 99.990517,21.986473 107.299026,29.238825 C114.784737,36.667015 116.456306,46.141281 111.753365,56.814762 C108.594429,63.984055 108.686546,70.879311 111.723373,78.048256 C116.413246,89.119484 114.840050,98.114845 107.295753,105.606270 C100.041145,112.810043 90.655548,114.423203 80.097847,109.803802 C72.929146,106.667221 66.039406,106.519226 58.892567,109.748161 C49.006657,114.214607 39.691162,113.329453 31.616970,105.706474 C24.185816,98.690598 22.416767,88.766891 27.010090,78.097900 C30.194084,70.702385 30.117870,63.777412 26.914850,56.431980 C22.614031,46.568977 23.521479,37.191795 31.330524,29.216349 C38.444107,21.951187 48.406021,20.615679 59.067524,25.093157 C61.356224,26.054338 63.799503,26.647440 66.583504,27.481339 z`,
      viewBox: `24 22 91 91`,
    },
  };

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

{#snippet indicator(id: string, active: boolean)}
  {@const el = indicators[id]}
  {@const className = cn(
    'absolute dark:text-primary inset-0 size-full transition-transform text-background',
    active ? 'scale-100' : 'scale-0'
  )}
  {#if el}
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      x="0px"
      y="0px"
      width="100%"
      viewBox={el.viewBox}
      enable-background="new {el.viewBox}"
      xml:space="preserve"
      class={className}><path fill="currentColor" opacity="1" stroke="none" d={el.path} /></svg
    >
  {:else}
    <div class={cn(className, 'dark:bg-primary bg-background rounded-full')}></div>
  {/if}
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
                  'relative h-12 font-mono items-center',
                  user ? 'w-12 px-2' : ' px-4',
                  active
                    ? 'text-primary dark:text-background'
                    : 'text-background dark:text-foreground'
                )}
              >
                {@render indicator(link.id, active)}
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
