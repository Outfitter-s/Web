import { getAnalogousColors } from './utils';
import type { ScoredClothingItem } from '$lib/types';

export function analogousScore(base: ScoredClothingItem, compare: ScoredClothingItem): number {
  if (!base.color || !compare.color) return 0;
  if (base.color === compare.color) return 1;

  const neighbors1 = getAnalogousColors(base.color, 1);
  const neighbors2 = getAnalogousColors(base.color, 2);

  if (neighbors1.includes(compare.color)) return 0.8;
  if (neighbors2.includes(compare.color)) return 0.5;
  return 0;
}
