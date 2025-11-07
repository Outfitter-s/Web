import { getTriadicColors, clamp01 } from './utils';
import type { ScoredClothingItem } from '$lib/types';

export function triadicScore(base: ScoredClothingItem, compare: ScoredClothingItem): number {
  if (!base.color || !compare.color) return 0;
  const triadicColors = getTriadicColors(base.color);
  return clamp01(triadicColors.includes(compare.color) ? 1 : 0);
}
