<script lang="ts">
  import { Spinner, Swiper } from '$lib/components';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Toaster } from '$lib/components/Toast/toast';
  import {
    CLOTHING_STYLES,
    OutfitPreviewZ,
    type Outfit,
    type SwiperCard,
    type Weather,
  } from '$lib/types';
  import {
    ArrowRight,
    CloudRainWind,
    Dices,
    Glasses,
    Snowflake,
    Sparkles,
    Sun,
    ThermometerSnowflake,
  } from '@lucide/svelte';
  import confetti from 'canvas-confetti';
  import z from 'zod';
  import i18n from '$lib/i18n';
  import { cn, hashStringToNumber, getWeather, logger, DateUtils } from '$lib/utils';
  import { fade } from 'svelte/transition';
  import { onDestroy, onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import MixAndMatch from './MixAndMatch.svelte';
  import Globals from '$lib/globals.svelte';
  import { FormalIcon } from '$lib/components/domainIcons';
  import Comfort from '$lib/components/domainIcons/Comfort.svelte';
  import Calendar from '$lib/components/ui/calendar/calendar.svelte';
  import * as Popover from '$lib/components/ui/popover';
  import { Label } from '$lib/components/ui/label';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
  import { page } from '$app/state';

  interface Props {
    provisionalDate: CalendarDate | null;
    onSelected?: (outfit: SwiperCard, date: Date) => void;
  }

  let { onSelected, provisionalDate = $bindable(null) }: Props = $props();

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
  let outfits = $derived(page.data.outfits as Outfit[]);
  let outfitId: number = $state(hashStringToNumber(cId)); // Start from a hash of the client ID
  let wether = $state<Weather | null>(null);
  let cards = $state<SwiperCard[]>([]);
  let loadingCards = $state(false);
  let datePopoverOpen = $state(false);
  let acceptedCard = $state<{ card: SwiperCard | null; open: boolean }>({
    card: null,
    open: false,
  });
  let multistageQuestions = $derived({
    weather: {
      options: Object.keys(weatherPresets),
      hint: wether && !provisionalDate ? getClosestWeatherPreset(wether) : null,
      icons: {
        sunny: Sun,
        rainy: CloudRainWind,
        cold: ThermometerSnowflake,
        snowy: Snowflake,
      },
    },
    style: {
      options: [...CLOTHING_STYLES],
      icons: {
        default: Dices,
        comfort: Comfort,
        new: Sparkles,
        style: Glasses,
        formal: FormalIcon,
      },
      hint: 'default',
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
  let mixAndMatchOpen = $state(false);

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
        body: JSON.stringify({
          outfit: {
            ...acceptedCard.card?.outfit,
            createdAt: provisionalDate?.toDate(getLocalTimeZone()) || new Date(),
          },
        }),
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
      await invalidateAll();
      onSelected?.(acceptedCard.card!, provisionalDate?.toDate(getLocalTimeZone()) || new Date());
      acceptedCard = { open: false, card: null };
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

  async function initialWeatherFetch() {
    if (wether || provisionalDate) return;
    try {
      wether = await getWeather();
    } catch (error) {
      logger.error('Error fetching weather:', error);
    }
  }

  onMount(() => {
    if (!provisionalDate) initialWeatherFetch();
  });

  $effect(() => {
    Globals.navBack.backButton = {
      shown: mixAndMatchOpen,
      action: () => {
        mixAndMatchOpen = false;
      },
    };
  });

  onDestroy(() => {
    Globals.navBack.backButton = {
      shown: false,
      action: undefined,
    };
  });
</script>

<Dialog.Root bind:open={acceptedCard.open} dismissible={false}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{i18n.t('wardrobe.outfitGeneration.chooseOutfitModal.title')}</Dialog.Title>
      <Dialog.Description
        >{i18n.t('wardrobe.outfitGeneration.chooseOutfitModal.description', {
          date: DateUtils.formatDate(provisionalDate?.toDate(getLocalTimeZone()) ?? new Date(), {
            allowDistance: true,
          }),
        })}</Dialog.Description
      >
    </Dialog.Header>

    {#if provisionalDate}
      <div class="flex flex-col gap-3">
        <Label for="provisionalDate" class="px-1">For when is it for ?</Label>
        <Popover.Root bind:open={datePopoverOpen}>
          <Popover.Trigger id="provisionalDate">
            {#snippet child({ props })}
              <Button {...props} variant="outline" class="w-48 justify-between font-normal">
                {provisionalDate
                  ? provisionalDate.toDate(getLocalTimeZone()).toLocaleDateString()
                  : 'Select date'}
                <ChevronDownIcon />
              </Button>
            {/snippet}
          </Popover.Trigger>
          <Popover.Content class="w-auto overflow-hidden p-0" align="start">
            <Calendar
              type="single"
              locale={i18n.locale}
              bind:value={provisionalDate}
              captionLayout="dropdown"
              isDateDisabled={(date) => {
                return outfits.some((outfit) =>
                  DateUtils.isSameDay(outfit.createdAt, date.toDate(getLocalTimeZone()))
                );
              }}
              onValueChange={() => {
                datePopoverOpen = false;
              }}
              minValue={today(getLocalTimeZone())}
            />
          </Popover.Content>
        </Popover.Root>
      </div>
    {/if}

    <Dialog.Footer>
      <Button
        type="button"
        variant="secondary"
        onclick={() => {
          if (provisionalDate) {
            provisionalDate = null;
          }
          acceptedCard = { open: false, card: null };
        }}>{i18n.t('wardrobe.outfitGeneration.chooseOutfitModal.cancelButton')}</Button
      >
      <Button onclick={handleConfirm}>
        {i18n.t('wardrobe.outfitGeneration.chooseOutfitModal.confirmButton')}
        <ArrowRight class="size-4" />
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

{#if mixAndMatchOpen || provisionalDate}
  <MixAndMatch {onSwiped} {provisionalDate} />
{:else}
  <!-- This markup is a mess of absolute elements over absolute elements -->
  <!-- It needs fixing but rn it works -->
  <!-- If you find yourself updating/adding things in here and have time to spare, -->
  <!-- please try to fix this mess before it becomes too much debt (it already kind of is...) -->
  <section class="relative min-h-[80dvh] flex h-full grow flex-col overflow-hidden">
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
            {#each Array(nbQuestions), index}
              <button
                onclick={() => {
                  if (index < multiStageAnswers.currentIndex)
                    multiStageAnswers.currentIndex = index;
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
              100}%; transform: translateX(-{multiStageAnswers.currentIndex *
              (100 / nbQuestions)}%);"
          >
            {#each Object.entries(multistageQuestions) as [id, question] (id)}
              <div class="flex flex-col gap-2 w-full items-center p-2">
                <h1 class="text-lg mb-4 font-semibold">
                  {i18n.t(`wardrobe.outfitGeneration.initialQuestions.${id}.question` as any)}
                </h1>
                <div class="grid gap-2 grid-cols-2 w-full">
                  {#each question.options as opt (opt)}
                    {@const selected = 'hint' in question && question.hint === opt}
                    {@const Icon =
                      'icons' in question && question.icons[opt as keyof typeof question.icons]}
                    <Button
                      onclick={() => completeQuestion(id as keyof typeof multistageQuestions, opt)}
                      variant="none"
                      class={cn(
                        'h-24 flex flex-col p-4 gap-2 rounded-xl text-foreground',
                        selected
                          ? 'dark:bg-primary bg-secondary dark:text-background text-foreground'
                          : 'bg-card'
                      )}
                    >
                      {#if Icon}
                        <div
                          class={cn(
                            'size-10 p-2 rounded-full flex items-center text-primary bg-secondary justify-center',
                            selected ? 'invert-100' : ''
                          )}
                        >
                          <Icon class="size-full" />
                        </div>
                      {/if}
                      {i18n.t(
                        `wardrobe.outfitGeneration.initialQuestions.${id}.options.${opt}` as any
                      )}
                    </Button>
                  {/each}
                </div>
              </div>
            {/each}
          </div>

          <div class="px-2 w-full relative rounded-full overflow-hidden">
            <div class="absolute bg-primary size-2 top-2 right-20 rounded-full"></div>
            <div class="absolute bg-primary size-2 bottom-2 left-20 rounded-full"></div>
            <div class="absolute bg-primary size-2 top-4 left-1/2 rounded-full"></div>

            <Button
              class="w-full backdrop-blur-md h-14 relative rounded-full p-2 bg-secondary/50 flex flex-row items-center justify-center group ltr:pr-14 rtl:pl-14"
              variant="none"
              onclick={() => setTimeout(() => (mixAndMatchOpen = true), 350)}
            >
              <span>{i18n.t('wardrobe.outfitGeneration.mixAndMatch.button')}</span>
              <div
                class="bg-primary absolute top-2 bottom-2 ease-out right-2 duration-300 text-background shrink-0 rounded-full w-10 h-10 group-focus:w-[calc(100%-1rem)] transition-all p-2"
              >
                <ArrowRight
                  class="size-full ease-back-in group-focus:-rotate-180 transition-all duration-300"
                />
              </div>
            </Button>
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
            <p class="mb-2 text-lg">
              {i18n.t('wardrobe.outfitGeneration.swiper.noMoreCards.title')}
            </p>
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
{/if}
