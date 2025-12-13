<script lang="ts">
  import { cn, isMobile, navHeight } from '$lib/utils';
  import type { SvelteHTMLElements } from 'svelte/elements';
  import FormImageDark from '$lib/assets/authForm/FormImageDark.jpg';
  import FormImageLight from '$lib/assets/authForm/FormImageLight.jpg';
  import * as Card from '$lib/components/ui/card';
  import Button from '$lib/components/ui/button/button.svelte';
  import i18n from '$lib/i18n';
  import { ArrowLeft } from '@lucide/svelte';
  import Globals from '$lib/globals.svelte';

  interface Props {
    reverse?: boolean;
    back?: string;
  }

  const easterEggParams = {
    clicks: 5,
    duration: 5000,
  };
  let imgClicks = $state<Date[]>([]);
  let easterEggActive = $state<boolean>(false);

  let {
    children,
    class: className,
    reverse = false,
    back,
    ...restProps
  }: Props & SvelteHTMLElements['div'] = $props();

  function onImageClick() {
    imgClicks.push(new Date());
    if (imgClicks.length > easterEggParams.clicks) {
      imgClicks = imgClicks.slice(-easterEggParams.clicks);
    }

    if (
      imgClicks.length === easterEggParams.clicks &&
      imgClicks[easterEggParams.clicks - 1].getTime() - imgClicks[0].getTime() <
        easterEggParams.duration
    ) {
      easterEggActive = !easterEggActive;
      imgClicks = [];
    }
  }
</script>

{#if easterEggActive}
  <div class="pointer-events-none absolute inset-0 z-50 backdrop-invert"></div>
{/if}

<div
  class={cn('relative flex flex-row overflow-hidden', reverse && 'flex-row-reverse', className)}
  style="height: calc(100dvh - {navHeight}px);"
  {...restProps}
>
  {#if back}
    <div class="animate-in zoom-in-0 absolute top-20 left-6 z-10">
      <Button variant="secondary" class="flex-row gap-2" href={back}>
        <ArrowLeft class="size-4" />
        {i18n.t('auth.formWrapper.back')}
      </Button>
    </div>
  {/if}
  {#if !isMobile.current}
    <div class="flex h-full w-[650px] shrink-0 flex-col items-center justify-center p-18">
      {@render children?.()}
    </div>

    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      onclick={onImageClick}
      class={cn(
        'animate-in relative size-full grow overflow-hidden duration-300 select-none',
        reverse ? 'slide-in-from-left rounded-r-[60px]' : 'slide-in-from-right rounded-l-[60px]'
      )}
    >
      {#if Globals.theme.mode.effective === 'dark'}
        <img
          draggable="false"
          src={FormImageDark}
          class="absolute inset-0 size-full object-cover"
          alt=""
        />
      {:else}
        <img
          draggable="false"
          src={FormImageLight}
          class="absolute inset-0 size-full object-cover"
          alt=""
        />
      {/if}
    </div>
  {:else}
    {#if Globals.theme.mode.effective === 'dark'}
      <img
        draggable="false"
        src={FormImageDark}
        class="absolute inset-0 size-full object-cover"
        alt=""
      />
    {:else}
      <img
        draggable="false"
        src={FormImageLight}
        class="absolute inset-0 size-full object-cover"
        alt=""
      />
    {/if}

    <div class="z-10 flex h-full w-full shrink-0 flex-col items-center justify-center p-4">
      <Card.Root class="w-full max-w-sm">
        <Card.Content>
          {@render children?.()}
        </Card.Content>
      </Card.Root>
    </div>
  {/if}
</div>
