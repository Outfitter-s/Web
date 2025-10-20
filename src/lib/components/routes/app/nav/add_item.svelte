<script lang="ts">
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
  import * as Field from '$lib/components/ui/field';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';

  interface Props {
    open?: boolean;
  }

  let color = $state<ClothingItemColor>(clothingItemColors[0]);
  let type = $state<ClothingItemType>(clothingItemTypes[0]);
  let { open = $bindable(false) }: Props = $props();
  let loading = $state(false);

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  async function submitHandler(event: Event) {
    event.preventDefault();
    if (loading) return;
    loading = true;
    const formData = new FormData(event.target as HTMLFormElement);
    const res = await fetch('/api/wardrobe/create-item', {
      method: 'POST',
      body: formData,
    });
    const result = await res.json();
    if (!res.ok) {
      const fields = result.message.split(', ');
      const multiple = fields.length > 1;
      const msg = $t('errors.clothing.item.requiredField', {
        field: result.message,
        s: multiple ? 's' : '',
        is: multiple ? 'are' : 'is',
      });
      logger.error('Creation error:', msg);
      Toaster.error(msg);
    } else {
      Toaster.success($t('successes.clothing.item.created'));
      (event.target as HTMLFormElement).reset();
      open = false;
    }
    loading = false;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{$t('wardrobe.createItem.title')}</Dialog.Title>
      <Dialog.Description>{$t('wardrobe.createItem.description')}</Dialog.Description>
    </Dialog.Header>
    <form onsubmit={submitHandler} class="mt-6 flex flex-col gap-4">
      <Field.Field>
        <Field.Label for="name">{$t('wardrobe.createItem.fields.name')}</Field.Label>
        <Input id="name" name="name" type="text" />
      </Field.Field>

      <Field.Field>
        <Field.Label for="description">Description</Field.Label>
        <Input id="description" name="description" type="text" />
      </Field.Field>

      <div class="grid grid-cols-2 gap-2">
        <Field.Field>
          <Field.Label for="type">{$t('wardrobe.createItem.fields.type')}</Field.Label>
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
          <Field.Label for="color">{$t('wardrobe.createItem.fields.color')}</Field.Label>
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
        <Field.Label for="image">{$t('wardrobe.createItem.fields.image')}</Field.Label>
        <Input id="image" name="image" type="file" accept="image/*" />
      </Field.Field>

      <Dialog.Footer>
        <Button type="submit" {loading}>{$t('wardrobe.createItem.submit')}</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
