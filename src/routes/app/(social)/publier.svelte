<script lang="ts">
  import { Toaster } from '$lib/components/Toast/toast';
  import i18n from '$lib/i18n';
  import { logger } from '$lib/utils/logger';
  import * as Field from '$lib/components/ui/field';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import { invalidateAll } from '$app/navigation';
  import Textarea from '$lib/components/ui/textarea/textarea.svelte';
  import { Switch } from '$lib/components/ui/switch';
  import { Label } from '$lib/components/ui/label';
  import { PublicationImagesLengths, type Outfit } from '$lib/types';
  import { DateUtils } from '$lib/utils';
  import { page } from '$app/state';
  import PictureTaker from '$lib/components/PictureTaker.svelte';

  interface Props {
    open?: boolean;
  }

  let { open = $bindable(false) }: Props = $props();

  let loading = $state(false);
  let hasOutfitForToday = $derived(
    ((page.data.outfits as Outfit[]) || []).find((o) => DateUtils.isToday(o.createdAt)) != null
  );
  let takenPictures = $state<string[]>([]);

  $effect(() => {
    if (!open) {
      resetForm();
    }
  });

  type FormValues = {
    description: string;
    todaysOutfit: boolean;
  };
  let formValues = $state<FormValues>({
    description: '',
    todaysOutfit: true,
  });

  async function submitHandler(event: Event) {
    event.preventDefault();
    if (loading) return;
    loading = true;
    const formData = new FormData(event.target as HTMLFormElement);
    for (const picture of takenPictures) {
      const response = await fetch(picture);
      const blob = await response.blob();
      const file = new File([blob], 'image.png', { type: blob.type });
      formData.append('images[]', file);
    }
    const res = await fetch('/api/social/publication', {
      method: 'POST',
      body: formData,
    });
    const result = await res.json();
    if (!res.ok) {
      const fields = result.message.split(', ');
      const multiple = fields.length > 1;
      const msg = i18n.t('errors.social.item.requiredField', {
        field: result.message,
        s: multiple ? 's' : '',
        is: multiple ? 'are' : 'is',
      });
      logger.error('Creation error:', msg);
      Toaster.error(msg as any);
    } else {
      Toaster.success('successes.social.item.created');
      (event.target as HTMLFormElement).reset();
      open = false;
      await invalidateAll();
    }
    loading = false;
  }

  function resetForm() {
    formValues = {
      description: '',
      todaysOutfit: true,
    };
    takenPictures = [];
    loading = false;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{i18n.t('social.feed.addPublication.title')}</Dialog.Title>
    </Dialog.Header>
    <form onsubmit={submitHandler} class="mt-6 flex flex-col gap-4">
      <div
        class="grid gap-6"
        style="grid-template-columns: repeat({Math.min(3, takenPictures.length)}, 1fr);"
      >
        {#each takenPictures as picture}
          <!-- svelte-ignore a11y_missing_attribute -->
          <img
            src={picture}
            class="border-border aspect-3/4 relative w-max mx-auto shrink-0 overflow-hidden max-h-[20dvh] rounded-lg border h-fit"
          />
        {/each}
      </div>
      {#if takenPictures.length < PublicationImagesLengths.max}
        <PictureTaker
          showPreview={false}
          class={{ container: 'w-full h-24 aspect-auto' }}
          onPictureTaken={(file) => {
            takenPictures.push(file);
            takenPictures.slice(0, PublicationImagesLengths.max - 1);
          }}
        />
      {/if}

      <Field.Field>
        <Field.Label for="description"
          >{i18n.t('social.feed.addPublication.description.label')}</Field.Label
        >
        <Textarea
          id="description"
          name="description"
          rows={2}
          bind:value={formValues.description}
        />
      </Field.Field>

      {#if hasOutfitForToday}
        <div class="flex flex-row items-center justify-between hap-4">
          <Label for="todaysOutfit">{i18n.t('social.feed.addPublication.todaysOutfit')}</Label>
          <Switch id="todaysOutfit" name="todaysOutfit" bind:checked={formValues.todaysOutfit} />
        </div>
      {/if}

      <Dialog.Footer>
        <Button type="submit" {loading}>{i18n.t('social.feed.addPublication.submit')}</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
