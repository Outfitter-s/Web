<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { Toaster } from '$lib/components/Toast/toast';
  import Input from '$lib/components/ui/input/input.svelte';
  import * as Select from '$lib/components/ui/select';
  import { Button } from '$lib/components/ui/button';
  import * as Field from '$lib/components/ui/field/index.js';
  import { t } from '$lib/i18n';
  import {
    clothingItemColors,
    clothingItemTypes,
    type ClothingItem,
    type ClothingItemColor,
    type ClothingItemType,
  } from '$lib/types';
  import { logger } from '$lib/utils/logger';
  import type { PageProps } from './$types';

  let { form }: PageProps = $props();
  let itemId = $derived<string>(page.params.itemId as string);
  let items = $derived<ClothingItem[]>(page.data.items);
  let item = $derived(items.find((it) => it.id === itemId));

  let name = $state(item?.name || '');
  let description = $state(item?.description || '');
  let color = $state<ClothingItemColor>(item?.color || clothingItemColors[0]);
  let type = $state<ClothingItemType>(item?.type || clothingItemTypes[0]);

  $effect(() => {
    if (!item) {
      throw new Error('Item not found');
    }
    name = item.name;
    description = item.description || '';
    color = item.color;
    type = item.type;
  });

  $effect(() => {
    if (form?.message && form?.action === 'update_item') {
      if (form?.error) {
        const fields = form.message.split(', ');
        const multiple = fields.length > 1;
        const msg = $t('errors.clothing.item.requiredField', {
          field: form.message,
          s: multiple ? 's' : '',
          is: multiple ? 'are' : 'is',
        });
        logger.error('Update error:', msg);
        Toaster.error(msg);
      } else {
        Toaster.success('Item updated successfully');
        goto(`/app/wardrobe/item/${itemId}`);
      }
    }
  });

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
</script>

{#if item}
  <div class="mx-auto w-full max-w-[650px] p-2">
    <form
      action="?/update_item"
      method="POST"
      class="border-border flex flex-col gap-4 rounded-lg border p-4"
      use:enhance
      enctype="multipart/form-data"
    >
      <h1 class="text-2xl font-bold">Edit Item</h1>
      <hr />

      <!-- Image preview -->
      <div class="flex justify-center">
        <img
          src={item.imageUrl}
          class="aspect-square max-h-[300px] rounded-lg object-cover"
          alt={item.name}
        />
      </div>

      <Field.Field>
        <Field.Label for="name">Name</Field.Label>
        <Input id="name" name="name" type="text" bind:value={name} />
      </Field.Field>

      <Field.Field>
        <Field.Label for="description">Description</Field.Label>
        <Input id="description" name="description" type="text" bind:value={description} />
      </Field.Field>

      <div class="grid grid-cols-2 gap-2">
        <Field.Field>
          <Field.Label for="type">Type</Field.Label>
          <Select.Root type="single" name="type" bind:value={type}>
            <Select.Trigger>{capitalize(type)}</Select.Trigger>
            <Select.Content>
              {#each clothingItemTypes as itemType}
                <Select.Item value={itemType} label={capitalize(itemType)} />
              {/each}
            </Select.Content>
          </Select.Root>
        </Field.Field>

        <Field.Field>
          <Field.Label for="color">Color</Field.Label>
          <Select.Root type="single" name="color" bind:value={color}>
            <Select.Trigger>{capitalize(color)}</Select.Trigger>
            <Select.Content>
              {#each clothingItemColors as itemColor}
                <Select.Item value={itemColor} label={capitalize(itemColor)} />
              {/each}
            </Select.Content>
          </Select.Root>
        </Field.Field>
      </div>

      <Field.Field>
        <Field.Label for="image">Change Image (optional)</Field.Label>
        <Input id="image" name="image" type="file" accept="image/*" />
      </Field.Field>

      <div class="flex gap-2">
        <Button type="submit" class="flex-1">Save Changes</Button>
        <Button type="button" variant="outline" href="/app/wardrobe/item/{itemId}">Cancel</Button>
      </div>
    </form>
  </div>
{/if}
