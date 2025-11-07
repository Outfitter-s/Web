import { isWaterproof } from './utils';
import type { ScoredClothingItem } from '$lib/types';

export function rainScore(item: ScoredClothingItem, weather: any): number {
  const rain = Number.parseFloat(weather.rain || '0');

  if (rain > 1) {
    return isWaterproof(item) ? 1 : 0.2;
  }
  return isWaterproof(item) ? 0.4 : 0.6;
}
