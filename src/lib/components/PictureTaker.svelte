<script lang="ts">
  import i18n from '$lib/i18n';
  import * as Field from '$lib/components/ui/field';
  import { Button } from '$lib/components/ui/button';
  import { cn } from '$lib/utils';
  import { Camera } from '@lucide/svelte';
  import { fade, slide } from 'svelte/transition';
  import { portal } from '$lib/utils/portal.svelte';
  import Spinner from './Spinner';

  interface Props {
    width?: number;
    height?: number;
    onPictureTaken: (file: string) => void;
    pictureModalOpen?: boolean;
    onPictureModalChange?: (open: boolean) => void;
    error?: Parameters<typeof i18n.t>[0];
    spinner?: boolean;
    pictureTaken?: string;
    showPreview?: boolean;
    class?: {
      container?: string;
      image?: string;
    };
  }

  let {
    width = 320,
    height = 0,
    onPictureTaken,
    pictureTaken = $bindable(),
    pictureModalOpen = $bindable(false),
    spinner = $bindable(false),
    onPictureModalChange,
    error,
    showPreview = false,
    class: className,
  }: Props = $props();

  let takePictureStates = $state({
    open: false,
    videoStream: null as MediaStream | null,
    canvas: null as HTMLCanvasElement | null,
    error: null as string | null,
    videoElement: null as HTMLVideoElement | null,
    streaming: false,
  });

  async function onImageUpload() {
    if (!pictureTaken) {
      return;
    }
    onPictureTaken(pictureTaken);
  }

  async function openCamera() {
    takePictureStates.open = true;
    if (onPictureModalChange) onPictureModalChange(takePictureStates.open);
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
    if (onPictureModalChange) onPictureModalChange(takePictureStates.open);
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
        open: false,
      };
      pictureTaken = data;
      closeCamera();
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
    pictureTaken = data;
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

{#if takePictureStates.open}
  <div class="fixed inset-0 z-50 bg-background" use:portal>
    <video
      bind:this={takePictureStates.videoElement}
      autoplay
      playsinline
      class="w-auto mx-auto rounded-md object-contain h-full max-h-[90dvh]"
    ></video>
    <div class="flex py-4 flex-row items-center justify-center">
      <Button
        variant="none"
        onclick={takePicture}
        class="bg-primary ring-primary ring-offset-card size-8 rounded-full ring-2 ring-offset-4"
      ></Button>
    </div>
  </div>
{/if}

{#if !pictureTaken || !showPreview}
  <button
    type="button"
    onclick={openCamera}
    class={cn(
      'border-muted hover:border-input hover:bg-input/30 relative flex min-h-25 grow cursor-pointer flex-col items-center justify-center gap-4 rounded-md border-2 border-dashed text-center text-sm transition-colors w-full',
      error ? 'border-destructive hover:border-destructive' : '',
      className?.container
    )}
  >
    <Camera class="size-6" />
    <span class="text-muted-foreground">
      {i18n.t('wardrobe.createItem.fields.image.label')}
    </span>
  </button>
  {#if error}
    <Field.Error>{i18n.t(error)}</Field.Error>
  {/if}
{:else}
  <div
    class={cn(
      'border-border relative mx-auto w-full shrink-0 overflow-hidden rounded border min-h-50 max-h-[50dvh] h-fit',
      className?.container
    )}
  >
    {#if spinner}
      <div
        class="bg-input/30 absolute inset-0 flex flex-col items-center justify-center backdrop-blur-xs"
        transition:fade|local={{ duration: 200 }}
      >
        <Spinner class="size-6" />
      </div>
    {/if}
    <img
      src={pictureTaken}
      alt=""
      class={cn('w-full', className?.image)}
      transition:slide={{ axis: 'y', duration: 200 }}
    />
  </div>
{/if}
