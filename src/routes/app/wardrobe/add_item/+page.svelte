<script lang="ts">
  import { enhance } from '$app/forms';
  import { Toaster } from '$lib/components/Toast/toast';
  import Input from '$lib/components/ui/input/input.svelte';
  import * as Select from '$lib/components/ui/select';
  import { t } from '$lib/i18n';
  import {
    clothingItemColors,
    clothingItemTypes,
    type ClothingItemColor,
    type ClothingItemType,
  } from '$lib/types';
  import { logger } from '$lib/utils/logger';
  import type { PageProps } from './$types';
  import * as Field from '$lib/components/ui/field/index.js';
  import { Button } from '$lib/components/ui/button';

  let { form }: PageProps = $props();
  let color = $state<ClothingItemColor>(clothingItemColors[0]);
  let type = $state<ClothingItemType>(clothingItemTypes[0]);

  $effect(() => {
    if (form?.message && form?.action === 'create_item') {
      if (form?.error) {
        const fields = form.message.split(', ');
        const multiple = fields.length > 1;
        const msg = $t('errors.clothing.item.requiredField', {
          field: form.message,
          s: multiple ? 's' : '',
          is: multiple ? 'are' : 'is',
        });
        logger.error('Creation error:', msg);
        Toaster.error(msg);
      }
    }
  });

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
</script>

<div class="mx-auto w-full max-w-[650px] p-2">
  <form
    action="?/create_item"
    method="POST"
    class="border-border flex flex-col gap-4 rounded-lg border p-4"
    use:enhance
    enctype="multipart/form-data"
  >
    <h1 class="text-2xl font-bold">Add an item</h1>
    <hr />
    <Field.Field>
      <Field.Label for="name">Name</Field.Label>
      <Input id="name" name="name" type="text" />
    </Field.Field>

    <Field.Field>
      <Field.Label for="description">Description</Field.Label>
      <Input id="description" name="description" type="text" />
    </Field.Field>

    <div class="grid grid-cols-2 gap-2">
      <Field.Field>
        <Field.Label for="type">Type</Field.Label>
        <Select.Root type="single" name="type" bind:value={type}>
          <Select.Trigger>{capitalize(type)}</Select.Trigger>
          <Select.Content>
            {#each clothingItemTypes as type}
              <Select.Item value={type} label={capitalize(type)} />
            {/each}
          </Select.Content>
        </Select.Root>
      </Field.Field>

      <Field.Field>
        <Field.Label for="color">Color</Field.Label>
        <Select.Root type="single" name="color" bind:value={color}>
          <Select.Trigger>{capitalize(color)}</Select.Trigger>
          <Select.Content>
            {#each clothingItemColors as color}
              <Select.Item value={color} label={capitalize(color)} />
            {/each}
          </Select.Content>
        </Select.Root>
      </Field.Field>
    </div>

    <Field.Field>
      <Field.Label for="image">Image</Field.Label>
      <Input id="image" name="image" type="file" accept="image/*" />
    </Field.Field>

    <Button type="submit">Add Item</Button>
  </form>
</div>
