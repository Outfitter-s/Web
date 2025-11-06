<script lang="ts">
  import type { ClothingItem } from '$lib/types';

  interface Props {
    color: ClothingItem['color'];
  }

  let { color }: Props = $props();

  const colorMap: Record<ClothingItem['color'], string> = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    black: 'bg-black',
    white: 'bg-white',
    gray: 'bg-gray-500',
    brown: 'bg-yellow-800',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    orange: 'bg-orange-500',
  };
</script>

<div class={'size-4 rounded-full ' + colorMap[color]}></div>
