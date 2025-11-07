import { clamp01 } from './utils';
import { getTempIdeal } from './utils';
import type { ScoredClothingItem } from '$lib/types';

export function tempScore(item: ScoredClothingItem, weather: any): number {
  const temp = Number.parseFloat(weather.temp || '0');

  const { ideal, tol } = getTempIdeal(item.type?.toString());
  const tempDiff = Math.abs(temp - ideal);
  return clamp01(1 - tempDiff / Math.max(1, tol));
}
