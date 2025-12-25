<script lang="ts">
  import { capitalize, DateUtils, logger } from '$lib/utils';
  import { Calendar, Palette, Shirt, Pencil, Save, X, Trash2 } from '@lucide/svelte';
  import ColorDot from '$lib/components/colorDot.svelte';
  import { Button } from '$lib/components/ui/button';
  import { SEO } from '$lib/components';
  import i18n from '$lib/i18n';
  import type { PageProps } from './$types';
  import * as Select from '$lib/components/ui/select';
  import { fade } from 'svelte/transition';
  import Input from '$lib/components/ui/input/input.svelte';
  import * as Field from '$lib/components/ui/field';
  import { Textarea } from '$lib/components/ui/textarea';
  import { clothingItemColors, clothingItemTypes } from '$lib/types';
  import { Toaster } from '$lib/components/Toast/toast';
  import PictureTaker from '$lib/components/PictureTaker.svelte';
  import { invalidateAll } from '$app/navigation';
  import * as Dialog from '$lib/components/ui/dialog';
  import { enhance } from '$app/forms';
  import Globals from '$lib/globals.svelte';
  import { onDestroy, onMount } from 'svelte';

  let { data, form }: PageProps = $props();
  let item = $derived(data.item);
  let editModeEnabled = $state(false);
  // svelte-ignore state_referenced_locally
  let editedItem = $state({ ...item });
  let editedItemImage = $state<string | null>(null);
  let deleteItemConfirmOpen = $state(false);
  let isDeletingItem = $state(false);

  $effect(() => {
    if (form?.message && form?.action === 'delete') {
      logger.error('Log in error:', form.message);
      Toaster.error(form.message as any);
    }
  });

  onMount(() => {
    Globals.navBack.backButton.shown = true;
  });

  onDestroy(() => {
    Globals.navBack.backButton.shown = false;
  });

  async function saveItemChanges() {
    try {
      const formData = new FormData();
      for (const [key, value] of Object.entries(editedItem)) {
        formData.append(key, value as string);
      }
      if (editedItemImage) {
        const response = await fetch(editedItemImage);
        const blob = await response.blob();
        const image = new File([blob], 'picture.png', { type: blob.type });
        formData.append('image', image);
      }
      const res = await fetch(`/api/wardrobe/item`, {
        method: 'PATCH',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      editModeEnabled = false;
      await invalidateAll();
      Toaster.success('successes.clothing.item.updated');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error(msg);
      Toaster.error(msg as any);
    }
  }

  $effect(() => {
    // Reset edited item when item changes
    editedItem = { ...item };
  });
</script>

<SEO title="seo.wardrobe.item.title" description="seo.wardrobe.item.description" />

<!-- Delete item confirm modal -->
<Dialog.Root bind:open={deleteItemConfirmOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{i18n.t('wardrobe.itemPage.delete.title')}</Dialog.Title>
      <Dialog.Description>{i18n.t('wardrobe.itemPage.delete.description')}</Dialog.Description>
    </Dialog.Header>
    <form
      class="mt-6 flex flex-col gap-4 h-full grow"
      method="POST"
      action="?/delete"
      use:enhance={() => {
        isDeletingItem = true;
        return async ({ update }) => {
          await update({ reset: false });
          isDeletingItem = false;
        };
      }}
    >
      <Dialog.Footer class="mt-auto">
        <Button
          type="button"
          variant="outline"
          disabled={isDeletingItem}
          onclick={() => (deleteItemConfirmOpen = false)}
          >{i18n.t('wardrobe.itemPage.delete.cancel')}</Button
        >
        <Button
          type="submit"
          variant="destructive"
          disabled={isDeletingItem}
          loading={isDeletingItem}>{i18n.t('wardrobe.itemPage.delete.confirm')}</Button
        >
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>

<div class="lg:p-2 lg:pt-4 max-lg:p-4 lg:pl-4 mx-auto flex w-full max-w-300">
  <div class="bg-card w-full relative border-border flex flex-col rounded-lg border lg:flex-row">
    <!-- Image -->
    <div
      class="-ml-2 border border-border -mt-2 rounded-lg overflow-hidden bg-card lg:-mb-2 lg:max-w-1/2 max-lg:-mr-2 max-h-[70vh] lg:max-h-200 aspect-10/14 lg:aspect-square inline-block shrink-0 relative"
    >
      {#if editModeEnabled}
        <div class="absolute inset-0">
          <PictureTaker
            class={{
              container:
                'border-0 max-h-max min-h-0 h-full backdrop-blur-xs hover:backdrop-blur-md transition-all bg-card/70 hover:bg-card/70',
              image: 'h-full',
            }}
            onPictureTaken={(file) => {
              editedItemImage = file;
            }}
          />
        </div>
      {/if}
      <img src={item.imageUrl} alt={item.name} class="size-full object-cover object-center" />
    </div>

    <!-- Details -->
    <div class="flex w-full flex-col gap-4 p-2 lg:grow lg:p-4">
      <div class="flex items-start justify-between gap-2">
        {#if editModeEnabled}
          <Field.Field>
            <Field.Label for="name">{i18n.t('wardrobe.createItem.fields.name')}</Field.Label>
            <Input id="name" name="name" type="text" bind:value={editedItem.name} />
          </Field.Field>
        {:else}
          <h1 class="font-sans text-2xl font-bold">{item.name}</h1>
        {/if}
        <div class="flex flex-row">
          <Button
            variant="outline"
            size="icon"
            onclick={() => {
              if (editModeEnabled) {
                saveItemChanges();
              } else {
                editModeEnabled = true;
              }
            }}
          >
            <div class="size-4">
              {#if editModeEnabled}
                <span in:fade={{ duration: 400 }}>
                  <Save class="size-full" />
                </span>
              {:else}
                <span in:fade={{ duration: 400 }}>
                  <Pencil class="size-full" />
                </span>
              {/if}
            </div>
          </Button>
          {#if editModeEnabled}
            <Button
              class="ml-2"
              variant="destructive"
              size="icon"
              onclick={() => {
                editModeEnabled = false;
                editedItem = { ...item };
                editedItemImage = null;
              }}
            >
              <X class="size-4" />
            </Button>
          {:else}
            <Button
              class="ml-2"
              variant="destructive"
              size="icon"
              onclick={() => {
                deleteItemConfirmOpen = true;
              }}
            >
              <Trash2 class="size-4" />
            </Button>
          {/if}
        </div>
      </div>

      {#if editModeEnabled}
        <Field.Field>
          <Field.Label for="description"
            >{i18n.t('wardrobe.createItem.fields.description')}</Field.Label
          >
          <Textarea
            id="description"
            name="description"
            rows={2}
            bind:value={editedItem.description}
          />
        </Field.Field>
      {:else}
        <p class="font-mono text-base font-normal wrap-normal">{item.description}</p>
      {/if}

      {#if editModeEnabled}
        <div class="grid grid-cols-2 gap-2">
          <Field.Field>
            <Field.Label for="color">{i18n.t('wardrobe.createItem.fields.color')}</Field.Label>
            <Select.Root type="single" name="color" bind:value={editedItem.color}>
              <Select.Trigger>
                <div class="flex flex-row items-center gap-2">
                  <ColorDot color={editedItem.color} />
                  {capitalize(editedItem.color)}
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
          </Field.Field>

          <Field.Field>
            <Field.Label for="type">{i18n.t('wardrobe.createItem.fields.type')}</Field.Label>
            <Select.Root type="single" name="type" bind:value={editedItem.type}>
              <Select.Trigger>{capitalize(editedItem.type)}</Select.Trigger>
              <Select.Content>
                {#each clothingItemTypes as type (type)}
                  <Select.Item value={type} label={capitalize(type)} />
                {/each}
              </Select.Content>
            </Select.Root>
          </Field.Field>
        </div>
      {:else}
        <div
          class="grid w-full grid-rows-1"
          style="grid-template-columns: repeat({item.lastWornAt ? 3 : 2}, minmax(0, 1fr));"
        >
          <div class="flex flex-col gap-1">
            <div class="text-lg font-medium">
              <Palette class="mr-2 mb-1 inline size-5" />
              Color
            </div>
            <div class="flex flex-row items-center gap-2">
              <ColorDot color={item.color} />
              <span>{capitalize(item.color)}</span>
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <div class="text-lg font-medium">
              <Shirt class="mr-2 mb-1 inline size-5" />
              Type
            </div>
            <div>{capitalize(item.type)}</div>
          </div>

          {#if item.lastWornAt}
            <div class="flex flex-col gap-1">
              <div class="text-lg font-medium">
                <Calendar class="mr-2 mb-1 inline size-5" />
                Last Worn
              </div>
              <div>{DateUtils.formatDate(item.lastWornAt)}</div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>
