<script lang="ts">
  import { type ClothingItem, clothingItemTypes } from '$lib/types';

  const generateItem = () => {
    return {
      id: crypto.randomUUID() as ClothingItem['id'],
      type: clothingItemTypes[Math.floor(Math.random() * clothingItemTypes.length)],
      color: 'red',
      createdAt: new Date(),
      lastWornAt: new Date(),
      imageUrl: 'https://placehold.co/200x100',
    } as ClothingItem;
  };
  const items: ClothingItem[] = Array.from({ length: 20 }, generateItem);

  function getItemsByType(type: ClothingItem['type']): ClothingItem[] {
    return items.filter((item) => item.type === type);
  }
</script>

{#snippet scrollContainer(items: ClothingItem[])}
  <div
    class="no-scrollbar grid h-full snap-x snap-mandatory snap-always gap-2 overflow-x-auto px-[10dvw]"
    style="grid-template-columns: repeat({items.length}, 80dvw);"
  >
    {#each items as item}
      <div class="size-full snap-center">
        <!-- svelte-ignore a11y_img_redundant_alt -->
        <img src={item.imageUrl} alt="Outfit Image" class="size-full rounded-md object-cover" />
      </div>
    {/each}
  </div>
{/snippet}

<div class="h-dvh">
  <div
    class="grid-clos-1 grid h-full grow gap-2 py-2"
    style="grid-template-rows: repeat({clothingItemTypes.length}, 1fr);"
  >
    {#each clothingItemTypes as type}
      {@render scrollContainer(getItemsByType(type))}
    {/each}
  </div>
</div>
