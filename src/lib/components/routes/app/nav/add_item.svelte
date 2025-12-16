<script lang="ts">
  import { Toaster } from '$lib/components/Toast/toast';
  import Input from '$lib/components/ui/input/input.svelte';
  import * as Select from '$lib/components/ui/select';
  import i18n from '$lib/i18n';
  import {
    clothingItemColors,
    clothingItemTypes,
    type ClothingItemColor,
    type ClothingItemType,
  } from '$lib/types';
  import { logger } from '$lib/utils/logger';
  import * as Field from '$lib/components/ui/field';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import { capitalize, cn } from '$lib/utils';
  import { itemOpen } from '.';
  import { Camera } from '@lucide/svelte';
  import Spinner from '$lib/components/Spinner/Spinner.svelte';
  import { fade, slide } from 'svelte/transition';
  import { invalidateAll } from '$app/navigation';
  import ColorDot from '$lib/components/colorDot.svelte';
  import { Textarea } from '$lib/components/ui/textarea';

  let takePictureStates = $state({
    open: false,
    videoStream: null as MediaStream | null,
    canvas: null as HTMLCanvasElement | null,
    capturedImage: null as string | null,
    error: null as string | null,
    videoElement: null as HTMLVideoElement | null,
    streaming: false,
  });
  const width = 320; // We will scale the photo width to this
  let height = 0; // This will be computed based on the input stream
  let loading = $state(false);
  let processingImage = $state(false);
  let fieldsErrors = $state<string[]>([]);

  $effect(() => {
    if (!$itemOpen) {
      resetForm();
    }
  });

  type FormValues = {
    name: string;
    description: string;
    color: ClothingItemColor;
    type: ClothingItemType;
  };
  let formValues = $state<FormValues>({
    name: '',
    description: '',
    color: clothingItemColors[0],
    type: clothingItemTypes[0],
  });

  async function onImageUpload() {
    processingImage = true;
    if (!takePictureStates.capturedImage) {
      return;
    }
    const response = await fetch(takePictureStates.capturedImage);
    const blob = await response.blob();
    const file = new File([blob], 'uploaded_image.png', { type: blob.type });
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
        if (result.type && result.color)
          formValues.name = `${capitalize(result.color)} ${result.type}`;
        const buffer = result.buffer;
        const byteArray = new Uint8Array(buffer.data ?? buffer);
        const blob = new Blob([byteArray], { type: result.mime || 'image/png' });
        takePictureStates.capturedImage = URL.createObjectURL(blob);
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
    if (loading) return;
    loading = true;
    const formData = new FormData(event.target as HTMLFormElement);
    if (takePictureStates.capturedImage) {
      const response = await fetch(takePictureStates.capturedImage);
      const blob = await response.blob();
      const file = new File([blob], 'uploaded_image.png', { type: blob.type });
      formData.append('image', file);
    }
    const res = await fetch('/api/wardrobe/item/create', {
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
    };
    takePictureStates.capturedImage = '';
    processingImage = false;
    loading = false;
  }

  async function openCamera() {
    $itemOpen = false;
    takePictureStates.open = true;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    });
    takePictureStates.videoStream = stream;
    if (takePictureStates.videoElement) {
      takePictureStates.videoElement.srcObject = stream;
      takePictureStates.videoElement?.play();
    }
  }

  async function closeCamera() {
    takePictureStates.open = false;
    if (takePictureStates.videoStream) {
      takePictureStates.videoStream.getTracks().forEach((track) => track.stop());
      takePictureStates.videoStream = null;
    }
  }

  function takePicture() {
    if (!takePictureStates.canvas || !takePictureStates.videoElement) {
      return;
    }
    const context = takePictureStates.canvas.getContext('2d');
    if (width && height && context) {
      takePictureStates.canvas.width = width;
      takePictureStates.canvas.height = height;
      context.drawImage(takePictureStates.videoElement, 0, 0, width, height);

      const data = takePictureStates.canvas.toDataURL('image/png');
      takePictureStates = {
        ...takePictureStates,
        capturedImage: data,
        open: false,
      };
      closeCamera();
      $itemOpen = true;
      onImageUpload();
    } else {
      clearPhoto();
    }
  }

  function clearPhoto() {
    if (!takePictureStates.canvas || !takePictureStates.videoElement) {
      return;
    }
    const context = takePictureStates.canvas.getContext('2d');
    if (!context) {
      return;
    }
    context.fillStyle = '#aaaaaa';
    context.fillRect(0, 0, takePictureStates.canvas.width, takePictureStates.canvas.height);

    const data = takePictureStates.canvas.toDataURL('image/png');
    takePictureStates.capturedImage = data;
  }

  $effect(() => {
    if (!takePictureStates.videoElement) {
      return;
    }
    takePictureStates.videoElement.addEventListener('canplay', () => {
      if (
        !takePictureStates.videoStream ||
        !takePictureStates.videoElement ||
        !takePictureStates.canvas
      ) {
        return;
      }
      if (!takePictureStates.streaming) {
        height =
          takePictureStates.videoElement.videoHeight /
          (takePictureStates.videoElement.videoWidth / width);

        takePictureStates.videoElement.setAttribute('width', width.toString());
        takePictureStates.videoElement.setAttribute('height', height.toString());
        takePictureStates.canvas.setAttribute('width', width.toString());
        takePictureStates.canvas.setAttribute('height', height.toString());
        takePictureStates.streaming = true;
      }
    });
  });
</script>

<canvas class="hidden" bind:this={takePictureStates.canvas}></canvas>

<Dialog.Root bind:open={takePictureStates.open} dismissible={false}>
  <Dialog.Content>
    <!-- svelte-ignore a11y_media_has_caption -->
    <!-- svelte-ignore element_invalid_self_closing_tag -->
    <video
      bind:this={takePictureStates.videoElement}
      autoplay
      playsinline
      class="max-h-96 w-full rounded-md object-contain"
    />
    <Dialog.Footer class="justify-center">
      <!-- <Button variant="secondary" onclick={closeCamera}>Cancel</Button> -->
      <Button
        variant="none"
        onclick={takePicture}
        class="bg-primary ring-primary ring-offset-card size-8 rounded-full ring-2 ring-offset-4"
      ></Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={$itemOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{i18n.t('wardrobe.createItem.title')}</Dialog.Title>
      <Dialog.Description>{i18n.t('wardrobe.createItem.description')}</Dialog.Description>
    </Dialog.Header>
    <form onsubmit={submitHandler} class="mt-6 flex flex-col gap-4">
      <div class="flex w-full flex-col">
        {#if !takePictureStates.capturedImage}
          <button
            type="button"
            onclick={openCamera}
            class={cn(
              'border-muted hover:border-input hover:bg-input/30 relative flex min-h-25 grow cursor-pointer flex-col items-center justify-center gap-4 rounded-md border-2 border-dashed text-center text-sm transition-colors',
              fieldsErrors.includes('image') ? 'border-destructive hover:border-destructive' : ''
            )}
          >
            <Camera class="size-6" />
            <span class="text-muted-foreground">
              {i18n.t('wardrobe.createItem.fields.image.label')}
            </span>
          </button>
          {#if fieldsErrors.includes('image')}
            <Field.Error>{i18n.t('errors.clothing.item.image')}</Field.Error>
          {/if}
        {:else}
          <div
            class="border-border relative mx-auto min-h-25 w-full shrink-0 overflow-hidden rounded border"
          >
            {#if processingImage}
              <div
                class="bg-input/30 absolute inset-0 flex flex-col items-center justify-center backdrop-blur-xs"
                transition:fade|local={{ duration: 200 }}
              >
                <Spinner class="size-6" />
              </div>
            {/if}
            <img
              src={takePictureStates.capturedImage}
              alt=""
              class="h-50"
              transition:slide={{ axis: 'y', duration: 200 }}
            />
          </div>
        {/if}
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

      <div class="grid grid-cols-2 gap-2">
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
              {#each clothingItemTypes as type}
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
              {#each clothingItemColors as color}
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
      </div>

      <Dialog.Footer>
        <Button type="submit" {loading}>{i18n.t('wardrobe.createItem.submit')}</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
