import type { ScoredClothingItem, Weather } from '$lib/types';
import { clamp01 } from './utils';

export function colorForUVScore(item: ScoredClothingItem, weather: Weather): number {
  const lightColors = ['white', 'yellow', 'pink', 'orange'];
  const neutralColors = ['black', 'gray', 'brown'];
  const chromatic = ['red', 'blue', 'green', 'purple'];

  const c = (item.color ?? '').toString().toLowerCase();
  let base = 0.5;
  if (lightColors.includes(c)) base = 0.8;
  else if (neutralColors.includes(c)) base = 0.6;
  else if (chromatic.includes(c)) base = 0.5;
  else base = 0.5;

  const uv = weather.uv;

  if (uv >= 3) {
    if (lightColors.includes(c)) base += 0.15;
    else if (chromatic.includes(c)) base -= 0.1;
  } else if (uv <= 1) {
    if (chromatic.includes(c)) base += 0.1;
    else if (lightColors.includes(c)) base -= 0.05;
  }
  return clamp01(base);
}
