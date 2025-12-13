<script lang="ts">
  import { Spinner, Swiper } from '$lib/components';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { CLOTHING_STYLES, OutfitPreviewZ, type SwiperCard, type ClothingStyles } from '$lib/types';
  import { ArrowRight } from '@lucide/svelte';
  import confetti from 'canvas-confetti';
  import z from 'zod';
  import i18n from '$lib/i18n';
  import { getWeather } from '$lib/utils/weather';
  import type { Weather } from '$lib/types';
  import { logger } from '$lib/utils/logger';
  import { Toaster } from '$lib/components/Toast/toast';

  const cId = $props.id(); // Deterministic client ID for outfit generation

  async function generateCards(count: number = 5): Promise<SwiperCard[]> {
    try {
      if (!weather) {
        weather = await getWeather();
      }
      const options = Object.entries(multiStageAnswers.answers).reduce((acc, [key, value]) => {
        if (value) {
          acc[key as keyof typeof multiStageAnswers.answers] = value;
        }
        return acc;
      }, {} as Record<keyof typeof multiStageAnswers.answers, string>);
      const cards: SwiperCard[] = [];
      const res = await fetch('/api/wardrobe/generate-outfit', {
        method: 'POST',
        body: JSON.stringify({ count, weather, ...options }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'errors.outfitGeneration.apiError');
      }
      // Validate outfit structure returned by the API against SwiperCard OutfitZ schema
      const isValid = z.array(OutfitPreviewZ).safeParse(data);
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
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error('Error generating outfits:', msg);
      Toaster.error(msg || 'errors.outfitGeneration.apiError');
    }
    return [];
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

  interface Props {
    chosenOutfit?: SwiperCard | null;
  }
  let { chosenOutfit = $bindable(null) }: Props = $props();
  let outfitId: number = $state(hashStringToNumber(cId)); // Start from a hash of the client ID
  let cards = $state<SwiperCard[]>([]);
  let loadingCards = $state(false);
  let weather = $state<Weather | null>(null);
  let acceptedCard = $state<{ card: SwiperCard | null; open: boolean }>({
    card: null,
    open: false,
  });
  const multistageQuestions = {
    style: {
      options: [...CLOTHING_STYLES],
    },
  };
  let multiStageAnswers = $state<{ open: boolean; currentIndex: number; answers: Record<keyof typeof multistageQuestions, string | null>}>({ open: false, currentIndex: 0, answers: {
    style: null,
  } });

  $effect(() => {
    multiStageAnswers.open = multiStageAnswers.currentIndex < Object.keys(multiStageAnswers.answers).length;
  })

  function onSwiped(card: SwiperCard, accepted: boolean) {
    if (accepted) {
      acceptedCard = { card: card, open: true };
    }
  }

  async function handleConfirm() {
    try {
      const res = await fetch('/api/wardrobe/save-outfit', {
        method: 'POST',
        body: JSON.stringify({ outfit: acceptedCard.card?.outfit }),
      });
      const data = await res.json();
      if(!res.ok) {
        throw new Error(data?.error || 'errors.outfitGeneration.saveOutfitError');
      }
      console.log('Outfit saved with ID:', data.id);
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
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error('Error saving outfit:', msg);
      Toaster.error(msg);
    }
  }

  async function onQuestionsComplete() {
    loadingCards = true;
    cards = await generateCards(5);
    loadingCards = false;
  }

  async function completeQuestion(key: keyof typeof multistageQuestions, value: any) {
    multiStageAnswers.answers[key] = value;
    multiStageAnswers.currentIndex += 1;
    if (multiStageAnswers.currentIndex >= Object.keys(multiStageAnswers.answers).length) {
      await onQuestionsComplete();
    }
  }

  function retryGenerate() {
    multiStageAnswers = { open: true, currentIndex: 0, answers: {
      style: null,
    } };
  }
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

<Dialog.Root bind:open={multiStageAnswers.open} dismissible={false}>
  {#each Object.entries(multistageQuestions) as [id, question]}
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Title>{i18n.t(`wardrobe.outfitGeneration.initialQuestions.${id}.question`)}</Dialog.Title>
      </Dialog.Header>
      <div class="grid gap-2 grid-cols-2">
        {#each question.options as opt}
          <Button onclick={() => completeQuestion(id as keyof typeof multistageQuestions, opt)} variant="outline">
            {i18n.t(`wardrobe.outfitGeneration.initialQuestions.${id}.options.${opt}`)}
          </Button>
        {/each}
      </div>
    </Dialog.Content>
  {/each}
</Dialog.Root>

<!-- If the user has not chosen an outfit for today, make it choose on before showing the timeline -->
{#if !chosenOutfit}
  <section class="relative flex h-full grow flex-col overflow-hidden">
    <div class="mx-auto flex h-full w-full max-w-[500px] grow flex-col p-2">
      {#if loadingCards}
        <div
          class="text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center"
        >
          <Spinner class="size-12" />
          <p class="text-sm">{i18n.t('wardrobe.outfitGeneration.swiper.loadingText')}</p>
        </div>
      {:else if ! multiStageAnswers.open}
        <div
          class="text-muted-foreground absolute inset-0 flex flex-col items-center justify-center p-4 text-center"
        >
          <p class="mb-2 text-lg">{i18n.t('wardrobe.outfitGeneration.swiper.noMoreCards.title')}</p>
          <p class="text-sm">{i18n.t('wardrobe.outfitGeneration.swiper.noMoreCards.subTitle')}</p>
          <Button class="mt-4" onclick={retryGenerate}>
            {i18n.t('wardrobe.outfitGeneration.swiper.noMoreCards.retryButton')}
          </Button>
        </div>
        <Swiper bind:cards {onSwiped} />
      {/if}
    </div>
  </section>
{/if}
