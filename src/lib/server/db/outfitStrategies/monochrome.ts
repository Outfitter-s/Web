import type { ScoredClothingItem } from '$lib/types';
import { NEUTRAL_COLORS } from './consts';

export function monochromeScore(base: ScoredClothingItem, compare: ScoredClothingItem): number {
  if (!base.color || !compare.color) return 0;
  if (base.color === compare.color) return 1;
  if (NEUTRAL_COLORS.includes(compare.color)) return 0.5;
  return 0;
}
