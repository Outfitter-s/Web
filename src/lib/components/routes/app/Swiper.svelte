<script lang="ts">
  import { Swiper } from '$lib/components';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { OutfitZ, type SwiperCard } from '$lib/types';
  import { ArrowRight } from '@lucide/svelte';
  import confetti from 'canvas-confetti';
  import { onMount } from 'svelte';
  import { logger } from '$lib/utils/logger';
  import z from 'zod';
  import i18n from '$lib/i18n';
  import { getWeather } from '$lib/utils/weather';
  import type { Weather } from '$lib/types';

  const cId = $props.id(); // Deterministic client ID for outfit generation

  async function generateCards(count: number = 5): Promise<SwiperCard[]> {
    if (!weather) {
      weather = await getWeather();
    }
    const cards: SwiperCard[] = [];
    const res = await fetch('/api/wardrobe/generate-outfit', {
      method: 'POST',
      body: JSON.stringify({ count, weather }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || 'errors.outfitGeneration.apiError');
    }
    // Validate outfit structure returned by the API against SwiperCard OutfitZ schema
    const isValid = z.array(OutfitZ.omit({ id: true })).safeParse(data);
    if (!isValid.success) {
      throw new Error('errors.outfitGeneration.apiError');
    }
    for (const outfit of isValid.data) {
      cards.push({
        id: outfitId,
        outfit,
      });
      outfitId++;
    }
    return cards;
  }

  // Deterministically generate a number from the input string using a hash function
  function hashStringToNumber(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  let outfitId: number = $state(hashStringToNumber(cId)); // Start from a hash of the client ID
  let cards = $state<SwiperCard[]>([]);
  let loadingCards = $state(true);
  let weather = $state<Weather | null>(null);

  onMount(async () => {
    cards = await generateCards(5);
    loadingCards = false;
  });

  interface Props {
    chosenOutfit?: SwiperCard | null;
  }

  let acceptedCard = $state<{ card: SwiperCard | null; open: boolean }>({
    card: null,
    open: false,
  });
  let { chosenOutfit = $bindable(null) }: Props = $props();

  function onSwiped(card: SwiperCard, accepted: boolean) {
    if (accepted) {
      acceptedCard = { card: card, open: true };
    }
  }

  async function handleConfirm() {
    const count = 200;
    const defaults = {
      origin: { y: 1 },
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
    acceptedCard = { open: false, card: null };
    chosenOutfit = { ...acceptedCard.card } as SwiperCard;
  }

  async function fetchOutfit() {
    const res = await fetch('/api/generate-outfit', {
      method: 'POST',
    });
    const outfit = await res.json();
    logger.debug(outfit); // Affiche l'outfit généré
  }

  onMount(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'o') {
        fetchOutfit();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });
</script>

<Dialog.Root bind:open={acceptedCard.open} dismissible={false}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{i18n.t('wardrobe.outfitGeneration.chooseOutfitModal.title')}</Dialog.Title>
      <Dialog.Description
        >{i18n.t('wardrobe.outfitGeneration.chooseOutfitModal.description')}</Dialog.Description
      >
    </Dialog.Header>

    <Dialog.Footer>
      <Button
        type="button"
        variant="secondary"
        onclick={() => (acceptedCard = { open: false, card: null })}
        >{i18n.t('wardrobe.outfitGeneration.chooseOutfitModal.cancelButton')}</Button
      >
      <Button onclick={handleConfirm}>
        {i18n.t('wardrobe.outfitGeneration.chooseOutfitModal.confirmButton')}
        <ArrowRight class="size-4" />
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- If the user has not chosen an outfit for today, make it choose on before showing the timeline -->
{#if !chosenOutfit}
  <section class="relative flex h-full grow flex-col overflow-hidden">
    <div class="mx-auto flex h-full w-full max-w-[500px] grow flex-col p-2">
      <Swiper bind:cards bind:loading={loadingCards} {onSwiped} />
    </div>
  </section>
{/if}
