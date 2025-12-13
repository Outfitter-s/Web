import { type ScoredClothingItem, NEUTRAL_COLORS } from '$lib/types';

export function monochromeScore(base: ScoredClothingItem, compare: ScoredClothingItem): number {
  if (!base.color || !compare.color) return 0;
  if (base.color === compare.color) return 1;
  if (NEUTRAL_COLORS.includes(compare.color)) return 0.5;
  return 0;
}
