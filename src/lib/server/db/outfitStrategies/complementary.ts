import type { ScoredClothingItem } from '$lib/types';
import { getComplementaryColors } from './utils';

export function complementaryScore(base: ScoredClothingItem, compare: ScoredClothingItem): number {
  if (!base.color || !compare.color) return 0;

  const complementaryColors = getComplementaryColors(base.color);

  if (compare.color === complementaryColors[1]) {
    return 1;
  }
  if (complementaryColors.slice(2).includes(compare.color)) {
    return 0.5;
  }
  return 0;
}
