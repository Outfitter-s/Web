import { clamp01 } from './utils';
import { getTempIdeal } from './utils';
import type { ScoredClothingItem, Weather } from '$lib/types';

export function tempScore(item: ScoredClothingItem, weather: Weather): number {
  const { ideal, tol } = getTempIdeal(item.type?.toString());
  const tempDiff = Math.abs(weather.temp - ideal);
  return clamp01(1 - tempDiff / Math.max(1, tol));
}
