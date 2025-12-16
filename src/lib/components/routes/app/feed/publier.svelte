<script lang="ts">
  import { Toaster } from '$lib/components/Toast/toast';
  import Input from '$lib/components/ui/input/input.svelte';
  import i18n from '$lib/i18n';
  import { logger } from '$lib/utils/logger';
  import * as Field from '$lib/components/ui/field';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import { publierOpen } from '.';
  import { Camera } from '@lucide/svelte';
  import Spinner from '$lib/components/Spinner/Spinner.svelte';
  import { fade, slide } from 'svelte/transition';
  import { invalidateAll } from '$app/navigation';

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

  $effect(() => {
    if (!$publierOpen) {
      resetForm();
    }
  });

  type FormValues = {
    description: string;
  };
  let formValues = $state<FormValues>({
    description: '',
  });

  async function onImageTaken() {
    processingImage = true;
    if (!takePictureStates.capturedImage) {
      return;
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
      const file = new File([blob], 'image.png', { type: blob.type });
      formData.append('image', file);
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
      Toaster.error(msg);
    } else {
      Toaster.success(i18n.t('successes.social.item.created'));
      (event.target as HTMLFormElement).reset();
      $publierOpen = false;
      await invalidateAll();
    }
    loading = false;
  }

  function resetForm() {
    formValues = {
      description: '',
    };
    takePictureStates.capturedImage = '';
    processingImage = false;
    loading = false;
  }

  async function openCamera() {
    $publierOpen = false;
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
      $publierOpen = true;
      onImageTaken();
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

<Dialog.Root bind:open={$publierOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{i18n.t('social.feed.addPublication.title')}</Dialog.Title>
    </Dialog.Header>
    <form onsubmit={submitHandler} class="mt-6 flex flex-col gap-4">
      <div class="flex w-full flex-col">
        {#if !takePictureStates.capturedImage}
          <button
            type="button"
            onclick={openCamera}
            class="border-muted hover:border-input hover:bg-input/30 relative flex min-h-[100px] grow cursor-pointer flex-col items-center justify-center gap-4 rounded-md border-2 border-dashed text-center text-sm transition-colors"
          >
            <Camera class="size-6" />
            <span class="text-muted-foreground">
              {i18n.t('wardrobe.createItem.fields.image.label')}
            </span>
          </button>
        {:else}
          <div
            class="border-border relative mx-auto h-[200px] shrink-0 overflow-hidden rounded border"
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
              class="h-[200px]"
              transition:slide={{ axis: 'y', duration: 200 }}
            />
          </div>
        {/if}
      </div>

      <Field.Field>
        <Field.Label for="name"
          >{i18n.t('social.feed.addPublication.description.label')}</Field.Label
        >
        <Input
          id="description"
          name="description"
          type="text"
          bind:value={formValues.description}
        />
      </Field.Field>

      <Dialog.Footer>
        <Button type="submit" {loading}>{i18n.t('social.feed.addPublication.submit')}</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
