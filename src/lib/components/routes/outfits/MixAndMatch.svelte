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
    };
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
<a
  href="https://thothub.lol/videos/1221727/lela-sohna-naked-laying-on-bed-onlyfans/"
  title="Lela Sohna Naked Laying on Bed Onlyfans"
>
  <div class="img">
    <img
      class="thumb lazy-load"
      src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
      data-original="https://thothub.lol/contents/videos_screenshots/1221000/1221727/320x180/5.jpg"
      alt="Lela Sohna Naked Laying on Bed Onlyfans"
      data-cnt="5"
      width="320"
      height="180"
    />
    <span class="line-private"><span class="ico-private">Private</span></span>
    <span class="ico-fav-0" title="Add to Favorites" data-fav-video-id="1221727" data-fav-type="0"
    ></span>
    <span class="ico-fav-1" title="Watch Later" data-fav-video-id="1221727" data-fav-type="1"
    ></span>
    <span class="views-counter">13K views</span>
    <span class="views-counter2">0:09</span>
  </div>
  <strong class="title"> Lela Sohna Naked Laying on Bed Onlyfans </strong>
  <div style="padding: 0 1rem 0; margin: 0 0 5px;">
    <div style="color:#999;">9 months ago</div>
  </div>
</a>
