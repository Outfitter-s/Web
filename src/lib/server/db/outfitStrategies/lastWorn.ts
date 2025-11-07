import { clamp01 } from './utils';
import type { ScoredClothingItem } from '$lib/types';

export function lastWornScore(item: ScoredClothingItem | null): number {
  if (!item || !item.lastWornAt) return 1;
  const days = Math.max(
    0,
    Math.floor((Date.now() - item.lastWornAt.getTime()) / (1000 * 60 * 60 * 24))
  );
  return clamp01(Math.log(days + 1) / Math.log(31));
}
