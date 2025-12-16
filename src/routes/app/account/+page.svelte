<script lang="ts">
  import * as Tabs from '$lib/components/ui/tabs';
  import * as Card from '$lib/components/ui/card';
  import Passkey from './passkey.svelte';
  import Totp from './totp.svelte';
  import i18n from '$lib/i18n';
  import Password from './password.svelte';
  import General from './general.svelte';
  import { SEO } from '$lib/components';

  let entries = $derived([
    {
      name: 'General',
      component: General,
      title: i18n.t('account.tabs.general.title'),
      description: i18n.t('account.tabs.general.description'),
    },
    {
      name: 'Password',
      component: Password,
      title: i18n.t('account.tabs.password.title'),
      description: i18n.t('account.tabs.password.description'),
    },
    {
      name: 'TOTP',
      component: Totp,
      title: i18n.t('account.tabs.TOTP.title'),
      description: i18n.t('account.tabs.TOTP.description'),
    },
    {
      name: 'Passkey',
      component: Passkey,
      title: i18n.t('account.tabs.passkey.title'),
      description: i18n.t('account.tabs.passkey.description'),
    },
  ]);
</script>

<SEO title={'seo.account.settings.title'} description="seo.account.settings.description" />

<Tabs.Root value={entries[0].name} class="mx-auto flex w-full max-w-250 flex-col gap-4 p-2">
  <Tabs.List class="mx-auto">
    {#each entries as e (e.name)}
      <Tabs.Trigger value={e.name}>{e.title}</Tabs.Trigger>
    {/each}
  </Tabs.List>
  {#each entries as e (e.name)}
    <Tabs.Content value={e.name}>
      <Card.Root>
        <Card.Header>
          <Card.Title>{e.title}</Card.Title>
          <Card.Description>{e.description}</Card.Description>
        </Card.Header>
        <Card.Content class="grid gap-6">
          <e.component />
        </Card.Content>
      </Card.Root>
    </Tabs.Content>
  {/each}
</Tabs.Root>
