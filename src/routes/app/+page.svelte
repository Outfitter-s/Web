<script lang="ts">
  import { OutfitCard, SEO } from '$lib/components';
  import Swiper from './Swiper.svelte';
  import type { Outfit } from '$lib/types';
  import { DateUtils } from '$lib/utils';
  import { page } from '$app/state';
  import * as Empty from '$lib/components/ui/empty';
  import i18n from '$lib/i18n';
  import { ArrowRight, Shirt } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import { logger } from '$lib/utils/logger';
  import { Toaster } from '$lib/components/Toast/toast';
  import { invalidateAll } from '$app/navigation';

  let chosenOutfit = $derived(
    (page.data.outfits as Outfit[]).find((o) => DateUtils.isToday(o.createdAt)) ?? null
  );
  let changeOutfitConfirmModal = $state({ open: false, loading: false });

  async function changeOutfit() {
    changeOutfitConfirmModal.loading = true;
    try {
      const res = await fetch('/api/wardrobe/outfit/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outfitId: chosenOutfit!.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unknown error');
      }
      changeOutfitConfirmModal.open = false;
      await invalidateAll();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error('Error changing outfit:', msg);
      Toaster.error((msg as any) || 'errors.clothing.outfit.delete');
    } finally {
      changeOutfitConfirmModal.loading = false;
    }
  }
</script>

<SEO title="seo.homePage.title" description="seo.homePage.description" />

<Dialog.Root bind:open={changeOutfitConfirmModal.open} dismissible={false}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{i18n.t('wardrobe.outfitGeneration.choosen.change.title')}</Dialog.Title>
      <Dialog.Description
        >{i18n.t('wardrobe.outfitGeneration.choosen.change.description')}</Dialog.Description
      >
    </Dialog.Header>

    <Dialog.Footer>
      <Button
        type="button"
        variant="secondary"
        onclick={() => (changeOutfitConfirmModal.open = false)}
        disabled={changeOutfitConfirmModal.loading}
        >{i18n.t('wardrobe.outfitGeneration.choosen.change.cancel')}</Button
      >
      <Button
        onclick={changeOutfit}
        variant="destructive"
        loading={changeOutfitConfirmModal.loading}
        disabled={changeOutfitConfirmModal.loading}
      >
        {i18n.t('wardrobe.outfitGeneration.choosen.change.confirm')}
        <ArrowRight class="size-4" />
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- If the user has not chosen an outfit for today, make it choose on before showing the timeline -->
{#if !chosenOutfit}
  <Swiper />
{:else}
  <section class="relative max-w-250 mx-auto w-full flex h-full grow flex-col overflow-hidden">
    <Empty.Root>
      <Empty.Header>
        <Empty.Media variant="icon">
          <Shirt />
        </Empty.Media>
        <Empty.Title>{i18n.t('wardrobe.outfitGeneration.choosen.title')}</Empty.Title>
        <Empty.Description>
          {i18n.t('wardrobe.outfitGeneration.choosen.description')}
        </Empty.Description>
      </Empty.Header>
      <Empty.Content>
        <Button onclick={() => (changeOutfitConfirmModal.open = true)}
          >{i18n.t('wardrobe.outfitGeneration.choosen.change.cta')}</Button
        >
      </Empty.Content>
    </Empty.Root>

    <div class="w-full grow">
      <OutfitCard
        outfit={chosenOutfit}
        showDate={false}
        href="/app/wardrobe/outfit/{chosenOutfit.id}"
      />
    </div>
  </section>
{/if}
