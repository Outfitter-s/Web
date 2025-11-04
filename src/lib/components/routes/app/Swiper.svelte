<script lang="ts">
  import { Swiper } from '$lib/components';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import type { SwiperCard } from '$lib/types';
  import { ArrowRight } from '@lucide/svelte';
  import confetti from 'canvas-confetti';
  import { page } from '$app/state';
  import { onMount } from 'svelte';

  let cards: SwiperCard[] = $state(page.data.cards);

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
    console.log(outfit); // Affiche l'outfit généré
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
      <Dialog.Title>Choose this outfit</Dialog.Title>
      <Dialog.Description>This will be the outfit you will be rocking today!</Dialog.Description>
    </Dialog.Header>

    <Dialog.Footer>
      <Button
        type="button"
        variant="secondary"
        onclick={() => (acceptedCard = { open: false, card: null })}>I changed my mind</Button
      >
      <Button onclick={handleConfirm}>
        Confirm
        <ArrowRight class="size-4" />
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- If the user has not chosen an outfit for today, make it choose on before showing the timeline -->
{#if !chosenOutfit}
  <section class="relative flex h-full grow flex-col overflow-hidden">
    <div class="mx-auto flex h-full w-full max-w-[500px] grow flex-col p-2">
      <Swiper bind:cards {onSwiped} />
    </div>
  </section>
{:else}
  <section class="flex h-full grow flex-col items-center justify-center p-4 text-center">
    <h1 class="mb-4 text-2xl font-bold">You have chosen your outfit for today!</h1>
    <p class="text-muted-foreground mb-8">Feel free to change it anytime by coming back here.</p>
    TIMELINE
  </section>
{/if}
