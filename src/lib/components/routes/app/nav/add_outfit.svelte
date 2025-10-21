<script lang="ts">
  import MixAndMatch from '$lib/components/routes/outfits/MixAndMatch.svelte';
  import * as Dialog from '$lib/components/ui/dialog';
  import { t } from '$lib/i18n';
  import { outfitOpen } from '.';
</script>

<Dialog.Root bind:open={$outfitOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{$t('wardrobe.createItem.title')}</Dialog.Title>
      <Dialog.Description>{$t('wardrobe.createItem.description')}</Dialog.Description>
    </Dialog.Header>

    <MixAndMatch />
  </Dialog.Content>
</Dialog.Root>
