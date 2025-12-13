import { isWaterproof } from './utils';
import type { ScoredClothingItem, Weather } from '$lib/types';

export function rainScore(item: ScoredClothingItem, weather: Weather): number {
  if (weather.rain > 1) {
    return isWaterproof(item) ? 1 : 0.2;
  }
  return isWaterproof(item) ? 0.4 : 0.6;
}
