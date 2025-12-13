<script lang="ts">
  import * as Tabs from '$lib/components/ui/tabs';
  import * as Card from '$lib/components/ui/card';
  import Passkey from './passkey.svelte';
  import Totp from './totp.svelte';
  import i18n from '$lib/i18n';
  import Password from './password.svelte';
  import General from './general.svelte';

  const entries = [
    {
      name: 'General',
      component: General,
      title: 'account.tabs.general.title',
      description: 'account.tabs.general.description',
    },
    {
      name: 'Password',
      component: Password,
      title: 'account.tabs.password.title',
      description: 'account.tabs.password.description',
    },
    {
      name: 'TOTP',
      component: Totp,
      title: 'account.tabs.TOTP.title',
      description: 'account.tabs.TOTP.description',
    },
    {
      name: 'Passkey',
      component: Passkey,
      title: 'account.tabs.passkey.title',
      description: 'account.tabs.passkey.description',
    },
  ];
</script>

<Tabs.Root value={entries[0].name} class="mx-auto flex w-full max-w-[1000px] flex-col gap-4 p-2">
  <Tabs.List class="mx-auto">
    {#each entries as e (e.name)}
      <Tabs.Trigger value={e.name}>{i18n.t(e.title)}</Tabs.Trigger>
    {/each}
  </Tabs.List>
  {#each entries as e (e.name)}
    <Tabs.Content value={e.name}>
      <Card.Root>
        <Card.Header>
          <Card.Title>{i18n.t(e.title)}</Card.Title>
          <Card.Description>{i18n.t(e.description)}</Card.Description>
        </Card.Header>
        <Card.Content class="grid gap-6">
          <svelte:component this={e.component} />
        </Card.Content>
      </Card.Root>
    </Tabs.Content>
  {/each}
</Tabs.Root>
