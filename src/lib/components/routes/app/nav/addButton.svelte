<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import { t } from '$lib/i18n';
  import AddItem from './add_item.svelte';

  interface Props {
    open?: boolean;
  }

  let { open = $bindable(false) }: Props = $props();
  let itemOpen = $state(false);
  let outfitOpen = $state(false);

  const choose = (choice: 'item' | 'outfit') => {
    open = false;
    setTimeout(() => {
      if (choice === 'item') {
        itemOpen = true;
      } else {
        outfitOpen = true;
      }
    }, 200);
  };
</script>

<AddItem bind:open={itemOpen} />

<Dialog.Root bind:open>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{$t('nav.add.title')}</Dialog.Title>
      <Dialog.Description>{$t('nav.add.description')}</Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer class="grid grid-cols-2 gap-4">
      <Button onclick={() => choose('item')}>{$t('nav.add.item')}</Button>
      <Button onclick={() => choose('outfit')}>{$t('nav.add.outfit')}</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
