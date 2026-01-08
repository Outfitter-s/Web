<script lang="ts">
  import { Toaster } from '$lib/components/Toast/toast';
  import Input from '$lib/components/ui/input/input.svelte';
  import * as Select from '$lib/components/ui/select';
  import i18n from '$lib/i18n';
  import {
    clothingItemColors,
    clothingItemTypes,
    clothingItempatterns,
    type ClothingItemColor,
    type ClothingItemType,
    type ClothingItempattern,
  } from '$lib/types';
  import { logger } from '$lib/utils/logger';
  import * as Field from '$lib/components/ui/field';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Square, AlignJustify, Grid, Circle, Flower, Image } from '@lucide/svelte';
  import { capitalize } from '$lib/utils';
  import { itemOpen } from '.';
  import { invalidateAll } from '$app/navigation';
  import ColorDot from '$lib/components/colorDot.svelte';
  import { Textarea } from '$lib/components/ui/textarea';
  import PictureTaker from '$lib/components/PictureTaker.svelte';

  let loading = $state(false);
  let processingImage = $state(false);
  let fieldsErrors = $state<string[]>([]);
  let pictureTaken = $state<string>();

  $effect(() => {
    if (!$itemOpen) {
      resetForm();
    }
  });

  function formatPatternLabel(s: string) {
    return s
      .split('_')
      .map((w) => capitalize(w))
      .join(' ');
  }

  const PatternIconMap: Record<ClothingItempattern, typeof Square> = {
    solid: Square,
    striped: AlignJustify,
    plaid: Grid,
    polka_dot: Circle,
    floral: Flower,
    graphic: Image,
    checked: Grid,
  };

  type FormValues = {
    name: string;
    description: string;
    color: ClothingItemColor;
    type: ClothingItemType;
    pattern: ClothingItempattern;
  };
  let formValues = $state<FormValues>({
    name: '',
    description: '',
    color: clothingItemColors[0],
    type: clothingItemTypes[0],
    pattern: clothingItempatterns[0],
  });

  async function onImageUpload() {
    processingImage = true;
    if (!pictureTaken) {
      return;
    }
    const response = await fetch(pictureTaken);
    const blob = await response.blob();
    const file = new File([blob], 'picture.png', { type: blob.type });
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch('/api/wardrobe/item/classify', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      if (res.ok) {
        if (result.type) formValues.type = result.type;
        if (result.color) formValues.color = result.color;
        if (result.pattern) formValues.pattern = result.pattern;
        if (result.type && result.color)
          formValues.name = `${capitalize(result.color)} ${result.type}`;
        const buffer = result.buffer;
        const byteArray = new Uint8Array(buffer.data ?? buffer);
        const blob = new Blob([byteArray], { type: result.mime || 'image/png' });
        pictureTaken = URL.createObjectURL(blob);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error('Error classifying clothing item :', msg);
      Toaster.error('errors.clothing.item.classificationFailed');
    }
    processingImage = false;
  }

  async function submitHandler(event: Event) {
    event.preventDefault();
    if (loading || !pictureTaken) return;
    loading = true;
    const response = await fetch(pictureTaken);
    const blob = await response.blob();
    const file = new File([blob], 'picture.png', { type: blob.type });
    const formData = new FormData(event.target as HTMLFormElement);
    formData.append('image', file);
    formData.append('pattern', String(formValues.pattern));
    const res = await fetch('/api/wardrobe/item', {
      method: 'POST',
      body: formData,
    });
    const result = await res.json();
    if (!res.ok) {
      fieldsErrors = result.message.split(',');
    } else {
      Toaster.success('successes.clothing.item.created');
      (event.target as HTMLFormElement).reset();
      $itemOpen = false;
      await invalidateAll();
    }
    loading = false;
  }

  function resetFormError(name: string) {
    fieldsErrors = fieldsErrors.filter((field) => field !== name);
  }

  function resetForm() {
    formValues = {
      name: '',
      description: '',
      color: clothingItemColors[0],
      type: clothingItemTypes[0],
      pattern: clothingItempatterns[0],
    };
    pictureTaken = undefined;
    processingImage = false;
    loading = false;
  }
</script>

<Dialog.Root bind:open={$itemOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{i18n.t('wardrobe.createItem.title')}</Dialog.Title>
      <Dialog.Description>{i18n.t('wardrobe.createItem.description')}</Dialog.Description>
    </Dialog.Header>
    <form onsubmit={submitHandler} class="mt-6 flex flex-col gap-4">
      <div class="flex w-full flex-col">
        <PictureTaker
          onPictureTaken={(file: string) => {
            pictureTaken = file;
            onImageUpload();
          }}
          bind:pictureTaken
          bind:spinner={processingImage}
          error={fieldsErrors.includes('image') ? 'errors.clothing.item.image' : undefined}
        />
      </div>

      <Field.Field data-invalid={fieldsErrors.includes('name')}>
        <Field.Label for="name">{i18n.t('wardrobe.createItem.fields.name')}</Field.Label>
        <Input
          id="name"
          name="name"
          type="text"
          onkeydown={() => resetFormError('name')}
          bind:value={formValues.name}
          aria-invalid={fieldsErrors.includes('name')}
        />
        {#if fieldsErrors.includes('name')}
          <Field.Error>{i18n.t('errors.clothing.item.name')}</Field.Error>
        {/if}
      </Field.Field>

      <Field.Field data-invalid={fieldsErrors.includes('description')}>
        <Field.Label for="description"
          >{i18n.t('wardrobe.createItem.fields.description')}</Field.Label
        >
        <Textarea
          id="description"
          name="description"
          rows={2}
          onkeydown={() => resetFormError('description')}
          bind:value={formValues.description}
          aria-invalid={fieldsErrors.includes('description')}
        />
        {#if fieldsErrors.includes('description')}
          <Field.Error>{i18n.t('errors.clothing.item.description')}</Field.Error>
        {/if}
      </Field.Field>

      <div class="grid grid-cols-3 gap-2">
        <Field.Field data-invalid={fieldsErrors.includes('type')}>
          <Field.Label for="type">{i18n.t('wardrobe.createItem.fields.type')}</Field.Label>
          <Select.Root
            type="single"
            name="type"
            bind:value={formValues.type}
            onValueChange={() => resetFormError('type')}
          >
            <Select.Trigger>{capitalize(formValues.type)}</Select.Trigger>
            <Select.Content>
              {#each clothingItemTypes as type (type)}
                <Select.Item value={type} label={capitalize(type)} />
              {/each}
            </Select.Content>
          </Select.Root>
          {#if fieldsErrors.includes('type')}
            <Field.Error>{i18n.t('errors.clothing.item.type')}</Field.Error>
          {/if}
        </Field.Field>

        <Field.Field data-invalid={fieldsErrors.includes('color')}>
          <Field.Label for="color">{i18n.t('wardrobe.createItem.fields.color')}</Field.Label>
          <Select.Root
            type="single"
            name="color"
            bind:value={formValues.color}
            onValueChange={() => resetFormError('color')}
          >
            <Select.Trigger>
              <div class="flex flex-row items-center gap-2">
                <ColorDot color={formValues.color} />
                {capitalize(formValues.color)}
              </div>
            </Select.Trigger>
            <Select.Content>
              {#each clothingItemColors as color (color)}
                <Select.Item value={color}>
                  <ColorDot {color} />
                  {capitalize(color)}
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
          {#if fieldsErrors.includes('color')}
            <Field.Error>{i18n.t('errors.clothing.item.color')}</Field.Error>
          {/if}
        </Field.Field>

        <Field.Field data-invalid={fieldsErrors.includes('pattern')}>
          <Field.Label for="pattern">{i18n.t('wardrobe.createItem.fields.pattern')}</Field.Label>
          <Select.Root
            type="single"
            name="pattern"
            bind:value={formValues.pattern}
            onValueChange={() => resetFormError('pattern')}
          >
            <Select.Trigger>
              <div class="flex items-center gap-2">
                <svelte:component this={PatternIconMap[formValues.pattern]} class="w-4 h-4" />
                {formatPatternLabel(formValues.pattern)}
              </div>
            </Select.Trigger>
            <Select.Content>
              {#each clothingItempatterns as pattern (pattern)}
                <Select.Item value={pattern}>
                  <div class="flex items-center gap-2">
                    <svelte:component this={PatternIconMap[pattern]} class="w-4 h-4" />
                    {formatPatternLabel(pattern)}
                  </div>
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
          {#if fieldsErrors.includes('pattern')}
            <Field.Error>{i18n.t('errors.clothing.item.pattern')}</Field.Error>
          {/if}
        </Field.Field>
      </div>

      <Dialog.Footer>
        <Button type="submit" {loading}>{i18n.t('wardrobe.createItem.submit')}</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
