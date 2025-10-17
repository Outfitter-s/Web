<script lang="ts">
  import { enhance } from '$app/forms';
  import { Toaster } from '$lib/components/Toast/toast';
  import { t } from '$lib/i18n';
  import { clothingItemTypes } from '$lib/types';
  import { logger } from '$lib/utils/logger';
  import type { PageProps } from './$types';

  let { form }: PageProps = $props();

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
</script>

<form
  action="?/create_item"
  method="POST"
  class="flex flex-col"
  use:enhance
  enctype="multipart/form-data"
>
  <label for="name">Name:</label>
  <input type="text" id="name" name="name" />

  <label for="description">Description:</label>
  <textarea id="description" name="description"></textarea>

  <label for="type">Type:</label>
  <select name="type" id="type">
    {#each clothingItemTypes as type}
      <option>{type}</option>
    {/each}
  </select>

  <label for="color">Color:</label>
  <input type="text" id="color" name="color" />

  <label for="image">Image:</label>
  <input type="file" id="image" name="image" accept="image/*" />

  <button type="submit">Add Item</button>
</form>
