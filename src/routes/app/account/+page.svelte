<script lang="ts">
  import i18n from '$lib/i18n';
  import { SEO } from '$lib/components';
  import { resolve } from '$app/paths';
  import { Scale, Settings } from '@lucide/svelte';
  import { ProfilePicture } from '$lib/components/social';
  import { page } from '$app/state';

  const sections = [
    {
      title: i18n.t('account.tabs.settings'),
      href: resolve('/app/account/settings'),
      icon: Settings,
    },
    {
      title: i18n.t('account.tabs.legal'),
      href: resolve('/legal/privacy-policy'),
      icon: Scale,
    },
  ];
</script>

<SEO title={'seo.account.title'} description="seo.account.description" />

<div class="mx-auto text-center flex flex-col gap-6 p-12">
  <ProfilePicture userId={page.data.user.id} class="size-32" />
  <h1 class="font-mono text-3xl font-semibold">{page.data.user.username}</h1>
  <p class="text-muted-foreground text-sm">{page.data.user.email}</p>
</div>

<div class="grid grid-cols-2 p-4 gap-4">
  {#each sections as { href, title, icon: Icon } (href)}
    <a {href} class="bg-card rounded-xl p-6 flex flex-col gap-2">
      <div
        class="size-10 p-2 rounded-full flex items-center text-primary bg-secondary justify-center"
      >
        <Icon class="size-full" />
      </div>
      <span class="font-mono text-lg">{title}</span>
    </a>
  {/each}
</div>
