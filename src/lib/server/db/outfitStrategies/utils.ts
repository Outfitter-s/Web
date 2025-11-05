import type { ClothingItem } from '$lib/types';
import type { ByType } from './types';

export function randIntInclusive(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  if (max < min) return min;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function hasTop(bt: ByType): boolean {
  return bt.shirt.length + bt.dress.length > 0;
}

export function hasPants(bt: ByType): boolean {
  return bt.pants.length > 0;
}

export function groupByColor(
  items: ClothingItem[],
  emptyByType: () => ByType
): Record<string, ByType> {
  const byColor: Record<string, ByType> = {};
  for (const item of items) {
    (byColor[item.color] ??= emptyByType())[item.type].push(item);
  }
  return byColor;
}

export function selectRandomAccessories(
  availableAccessories: ClothingItem[],
  maxCount: number = 3
): ClothingItem[] {
  const accessories: ClothingItem[] = [];
  if (availableAccessories.length > 0) {
    const maxNum = Math.min(availableAccessories.length, maxCount);
    const count = randIntInclusive(0, maxNum);
    const pool = [...availableAccessories];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      accessories.push(pool[idx]);
      pool.splice(idx, 1);
    }
  }
  return accessories;
}
