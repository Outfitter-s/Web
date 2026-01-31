<script lang="ts">
  import { SEO } from '$lib/components';
  import Swiper from './Swiper.svelte';
  import type { Outfit } from '$lib/types';
  import { DateUtils } from '$lib/utils';
  import { page } from '$app/state';
  import * as Empty from '$lib/components/ui/empty';
  import i18n from '$lib/i18n';
  import { ArrowRight, PlusIcon, Shirt, Trash2, XIcon } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import { logger } from '$lib/utils/logger';
  import { Toaster } from '$lib/components/Toast/toast';
  import { invalidateAll } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { OutfitCard } from '$lib/components/wardrobe';
  import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
  import * as Carousel from '$lib/components/ui/carousel';

  let outfits = $derived(page.data.outfits as Outfit[]);

  let todaySOutfit = $derived(outfits.find((o) => DateUtils.isToday(o.createdAt)) ?? null);
  let changeOutfitConfirmModal = $state({ open: false, loading: false });
  let provisionalOutfits = $derived(
    outfits.filter((o) => DateUtils.isInFuture(o.createdAt)).reverse()
  );
  let provisionalDate = $state<CalendarDate | null>(null);
  let provisionalGrid = $derived.by<{ date: Date; outfit?: Outfit }[]>(() => {
    // Creates a day by date [tomorrow, Min(furthest outfit, 1year)] array with outfits if they exist
    const result: { date: Date; outfit?: Outfit }[] = [];
    const todayDate = today(getLocalTimeZone()).toDate(getLocalTimeZone());
    const furthestOutfitDate = provisionalOutfits.reduce<Date | null>((max, outfit) => {
      if (!max || outfit.createdAt > max) return outfit.createdAt;

      return max;
    }, null);
    const endDate = furthestOutfitDate
      ? new Date(
          Math.min(furthestOutfitDate.getTime(), todayDate.getTime() + 365 * 24 * 60 * 60 * 1000)
        )
      : new Date(todayDate.getTime() + 365 * 24 * 60 * 60 * 1000);
    for (
      let d = new Date(todayDate.getTime() + 24 * 60 * 60 * 1000);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const outfit = provisionalOutfits.find((o) => DateUtils.isSameDay(o.createdAt, d));
      result.push({ date: new Date(d), outfit });
    }
    return result;
  });

  async function changeOutfit(outfitId: Outfit['id']) {
    changeOutfitConfirmModal.loading = true;
    try {
      const res = await fetch('/api/wardrobe/outfit/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outfitId }),
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

<SEO title="seo.home.homePage.title" description="seo.home.homePage.description" />

<Dialog.Root bind:open={changeOutfitConfirmModal.open}>
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
      {#if todaySOutfit}
        <Button
          onclick={() => {
            changeOutfit(todaySOutfit.id);
          }}
          variant="destructive"
          loading={changeOutfitConfirmModal.loading}
          disabled={changeOutfitConfirmModal.loading}
        >
          {i18n.t('wardrobe.outfitGeneration.choosen.change.confirm')}
          <ArrowRight class="size-4" />
        </Button>
      {/if}
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- If the user has not chosen an outfit for today, make it choose on before showing the timeline -->
{#if !todaySOutfit || provisionalDate}
  <Swiper
    bind:provisionalDate
    onSelected={() => {
      provisionalDate = null;
    }}
  />
{:else}
  <section class="relative flex h-full grow flex-col overflow-hidden">
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

    <OutfitCard
      outfit={todaySOutfit}
      showDate={false}
      href={resolve('/app/wardrobe/outfit/[outfitId]', { outfitId: todaySOutfit.id })}
    />
  </section>
{/if}

{#if !provisionalDate}
  <article class="mt-8 flex flex-col gap-4 p-2 pb-0">
    <div class="flex flex-row items-center justify-between gap-2">
      <h2 class="text-lg font-semibold">Upcoming Outfits</h2>
      <Button
        size="icon"
        onclick={() => (provisionalDate = today(getLocalTimeZone()).add({ days: 1 }))}
      >
        <PlusIcon class="size-4" />
      </Button>
    </div>
    {#if provisionalOutfits.length > 0}
      <Carousel.Root class="size-full">
        <Carousel.Content>
          {#each provisionalGrid as { outfit, date } (date.toISOString())}
            <Carousel.Item>
              {#if outfit}
                <div class="relative size-full flex flex-col">
                  <OutfitCard class="size-full" {outfit} />
                  <Button
                    variant="destructive"
                    size="icon"
                    class="absolute top-2 right-2"
                    onclick={() => {
                      changeOutfit(outfit.id);
                    }}
                  >
                    <Trash2 class="size-4" />
                  </Button>
                </div>
              {:else}
                <div class="relative size-full overflow-hidden rounded-xl">
                  <div
                    class="absolute inset-0 bg-[radial-gradient(var(--pattern-fg)_1px,transparent_0)] bg-size-[10px_10px] bg-fixed [--pattern-fg:var(--color-border)]/50"
                  ></div>
                  <div
                    class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-2 items-center justify-center"
                  >
                    <p class="font-medium whitespace-pre">
                      No outfit planned for {DateUtils.formatDate(date)}.
                    </p>
                    <Button
                      onclick={() => {
                        provisionalDate = new CalendarDate(
                          date.getFullYear(),
                          date.getMonth() + 1,
                          date.getDate()
                        );
                      }}
                    >
                      <PlusIcon class="size-4 mr-2" />
                      Plan Outfit
                    </Button>
                  </div>
                </div>
              {/if}
            </Carousel.Item>
          {/each}
        </Carousel.Content>
      </Carousel.Root>
    {:else}
      <p>You do not have any provisional outfits. Plan them now!</p>
      <Button onclick={() => (provisionalDate = today(getLocalTimeZone()).add({ days: 1 }))}>
        Plan tomorrow's outfit
      </Button>
    {/if}
  </article>
{/if}
