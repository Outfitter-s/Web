<script lang="ts">
  import * as Tabs from '$lib/components/ui/tabs';
  import * as Card from '$lib/components/ui/card';
  import Passkey from './passkey.svelte';
  import Totp from './totp.svelte';
  import { t } from '$lib/i18n';
  import Password from './password.svelte';
  import General from './general.svelte';

  const entries = [
    {
      name: 'General',
      component: General,
      title: 'account.settings.tabs.general.title',
      description: 'account.settings.tabs.general.description',
    },
    {
      name: 'Password',
      component: Password,
      title: 'account.settings.tabs.password.title',
      description: 'account.settings.tabs.password.description',
    },
    {
      name: 'TOTP',
      component: Totp,
      title: 'account.settings.tabs.TOTP.title',
      description: 'account.settings.tabs.TOTP.description',
    },
    {
      name: 'Passkey',
      component: Passkey,
      title: 'account.settings.tabs.passkey.title',
      description: 'account.settings.tabs.passkey.description',
    },
  ];
</script>

<Tabs.Root value={entries[0].name} class="mx-auto flex w-full max-w-[1000px] flex-col gap-4 p-2">
  <Tabs.List class="mx-auto">
    {#each entries as e (e.name)}
      <Tabs.Trigger value={e.name}>{$t(e.title)}</Tabs.Trigger>
    {/each}
  </Tabs.List>
  {#each entries as e (e.name)}
    <Tabs.Content value={e.name}>
      <Card.Root>
        <Card.Header>
          <Card.Title>{$t(e.title)}</Card.Title>
          <Card.Description>{$t(e.description)}</Card.Description>
        </Card.Header>
        <Card.Content class="grid gap-6">
          <svelte:component this={e.component} />
        </Card.Content>
      </Card.Root>
    </Tabs.Content>
  {/each}
</Tabs.Root>
