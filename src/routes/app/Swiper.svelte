<script lang="ts">
  import { Spinner, Swiper } from '$lib/components';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Toaster } from '$lib/components/Toast/toast';
  import { CLOTHING_STYLES, OutfitPreviewZ, type SwiperCard, type Weather } from '$lib/types';
  import { ArrowRight } from '@lucide/svelte';
  import confetti from 'canvas-confetti';
  import z from 'zod';
  import i18n from '$lib/i18n';
  import { cn, hashStringToNumber, getWeather, logger } from '$lib/utils';
  import { fade } from 'svelte/transition';
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';

  const cId = $props.id(); // Deterministic client ID for outfit generation

  const weatherPresets: Record<string, Weather> = {
    sunny: { temp: 25, rain: 0, uv: 8 },
    rainy: { temp: 15, rain: 80, uv: 3 },
    cold: { temp: 5, rain: 20, uv: 2 },
    snowy: { temp: -5, rain: 60, uv: 1 },
  };

  async function generateCards(count: number = 5): Promise<SwiperCard[]> {
    try {
      const weather: Weather = weatherPresets[multiStageAnswers.answers.weather!];
      const options = {
        style: multiStageAnswers.answers.style,
      };
      const cards: SwiperCard[] = [];
      const res = await fetch('/api/wardrobe/outfit/generate', {
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
      Toaster.error((msg as any) || 'errors.outfitGeneration.apiError');
    }
    return [];
  }

  let chosenOutfit = $state<SwiperCard | null>(null);
  let outfitId: number = $state(hashStringToNumber(cId)); // Start from a hash of the client ID
  let wether = $state<Weather | null>(null);
  let cards = $state<SwiperCard[]>([]);
  let loadingCards = $state(false);
  let acceptedCard = $state<{ card: SwiperCard | null; open: boolean }>({
    card: null,
    open: false,
  });
  let multistageQuestions = $derived({
    weather: {
      options: Object.keys(weatherPresets),
      hint: wether ? getClosestWeatherPreset(wether) : null,
    },
    style: {
      options: [...CLOTHING_STYLES],
    },
  });
  let multiStageAnswers = $state<{
    open: boolean;
    currentIndex: number;
    answers: Record<keyof typeof multistageQuestions, string | null>;
  }>({
    open: false,
    currentIndex: 0,
    answers: {
      weather: null,
      style: null,
    },
  });
  let nbQuestions = $derived(Object.keys(multistageQuestions).length);

  $effect(() => {
    multiStageAnswers.open =
      multiStageAnswers.currentIndex < Object.keys(multiStageAnswers.answers).length;
  });

  function onSwiped(card: SwiperCard, accepted: boolean) {
    if (accepted) {
      acceptedCard = { card: card, open: true };
    }
  }

  async function handleConfirm() {
    try {
      const res = await fetch('/api/wardrobe/outfit/save', {
        method: 'POST',
        body: JSON.stringify({ outfit: acceptedCard.card?.outfit }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'errors.outfitGeneration.saveOutfitError');
      }
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
      await invalidateAll();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error('Error saving outfit:', msg);
      Toaster.error((msg as any) || 'errors.outfitGeneration.saveOutfitError');
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
    multiStageAnswers = {
      open: true,
      currentIndex: 0,
      answers: {
        style: null,
        weather: null,
      },
    };
  }

  function getClosestWeatherPreset(weather: Weather): keyof typeof weatherPresets {
    let closestPreset = 'sunny';
    let smallestDiff = Infinity;
    for (const [key, preset] of Object.entries(weatherPresets)) {
      const diff =
        Math.abs(weather.temp - preset.temp) +
        Math.abs(weather.rain - preset.rain) +
        Math.abs(weather.uv - preset.uv);
      if (diff < smallestDiff) {
        smallestDiff = diff;
        closestPreset = key;
      }
    }
    return closestPreset;
  }

  onMount(async () => {
    try {
      wether = await getWeather();
    } catch (error) {
      logger.error('Error fetching weather:', error);
    }
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

<!-- This markup is a mess of absolute elements over absolute elements -->
<!-- It needs fixing but rn it works -->
<!-- If you find yourself updating/adding things in here and have time to spare, -->
<!-- please try to fix this mess before it becomes too much debt (it already kind of is...) -->
<section class="relative flex h-full grow flex-col overflow-hidden">
  <div
    class={cn(
      'mx-auto flex absolute inset-0 h-full w-full max-w-125 grow flex-col justify-center p-2'
    )}
  >
    {#if multiStageAnswers.open}
      <div
        class="flex flex-col gap-6 overflow-hidden absolute inset-0 justify-center"
        transition:fade={{ duration: 300 }}
      >
        <!-- Steps circles -->
        <div class="flex items-center justify-center px-2">
          {#each Array(nbQuestions) as _, index}
            <button
              onclick={() => {
                if (index < multiStageAnswers.currentIndex) multiStageAnswers.currentIndex = index;
              }}
              class={cn(
                'size-8 rounded-full font-mono text-center text-sm flex flex-col items-center justify-center transition-colors duration-500',
                index === multiStageAnswers.currentIndex
                  ? 'bg-accent'
                  : index < multiStageAnswers.currentIndex
                    ? 'bg-primary text-accent'
                    : 'bg-transparent border-2 border-border text-primary'
              )}
              disabled={index >= multiStageAnswers.currentIndex}>{index + 1}</button
            >
            {#if index < nbQuestions - 1}
              <div class="relative h-1 bg-border flex-1 overflow-hidden">
                <div
                  class="absolute h-full bg-primary transition-all duration-500"
                  style="width: {index < multiStageAnswers.currentIndex ? '100' : '0'}%;"
                ></div>
              </div>
            {/if}
          {/each}
        </div>

        <!-- Questions -->
        <div
          class="grid transition-transform duration-500"
          style="grid-template-columns: repeat({nbQuestions}, minmax(250px, 1fr)); width: {nbQuestions *
            100}%; transform: translateX(-{multiStageAnswers.currentIndex * (100 / nbQuestions)}%);"
        >
          {#each Object.entries(multistageQuestions) as [id, question]}
            <div class="flex flex-col gap-2 w-full items-center p-2">
              <h1 class="text-lg mb-4 font-semibold">
                {i18n.t(`wardrobe.outfitGeneration.initialQuestions.${id}.question` as any)}
              </h1>
              <div class="grid gap-2 grid-cols-2 w-full">
                {#each question.options as opt}
                  <Button
                    onclick={() => completeQuestion(id as keyof typeof multistageQuestions, opt)}
                    variant={'hint' in question && question.hint === opt ? 'default' : 'outline'}
                  >
                    {i18n.t(
                      `wardrobe.outfitGeneration.initialQuestions.${id}.options.${opt}` as any
                    )}
                  </Button>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {:else if !chosenOutfit}
      {#if loadingCards}
        <div
          class="text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center"
        >
          <Spinner class="size-12" />
          <p class="text-sm">{i18n.t('wardrobe.outfitGeneration.swiper.loadingText')}</p>
        </div>
      {:else}
        <div
          class="text-muted-foreground absolute inset-0 flex flex-col items-center justify-center p-4 text-center"
          transition:fade={{ duration: 300 }}
        >
          <p class="mb-2 text-lg">{i18n.t('wardrobe.outfitGeneration.swiper.noMoreCards.title')}</p>
          <p class="text-sm">{i18n.t('wardrobe.outfitGeneration.swiper.noMoreCards.subTitle')}</p>
          <Button class="mt-4" onclick={retryGenerate}>
            {i18n.t('wardrobe.outfitGeneration.swiper.noMoreCards.retryButton')}
          </Button>
        </div>
        <Swiper bind:cards {onSwiped} />
      {/if}
    {/if}
  </div>
</section>
