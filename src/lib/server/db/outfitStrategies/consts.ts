import type { ClothingItem, ClothingItemColor, ClothingItemType } from '$lib/types';

export type ByType = Record<ClothingItemType, ClothingItem[]>;

export const emptyByType = (): ByType => ({
  pants: [],
  sweater: [],
  dress: [],
  jacket: [],
  shirt: [],
  shoes: [],
  accessory: [],
});

export const NEUTRAL_COLORS: ClothingItemColor[] = ['white', 'black', 'gray', 'brown'];

export const COLOR_WHEEL: ClothingItemColor[] = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'pink',
  'white',
  'black',
  'gray',
  'brown',
];

export const PROFILE_WEIGHTS: Record<
  'default' | 'comfort' | 'new' | 'style' | 'class',
  { temp: number; rain: number; uv: number; lastWorn: number; color: number }
> = {
  comfort: { temp: 0.3, rain: 0.3, uv: 0.2, lastWorn: 0.1, color: 0.1 },
  new: { temp: 0.2, rain: 0.2, uv: 0.1, lastWorn: 0.4, color: 0.1 },
  style: { temp: 0.1, rain: 0.2, uv: 0.2, lastWorn: 0.2, color: 0.3 },
  class: { temp: 0.1, rain: 0.1, uv: 0.1, lastWorn: 0.1, color: 0.6 },
  default: { temp: 0.2, rain: 0.2, uv: 0.2, lastWorn: 0.2, color: 0.2 },
};

export const TEMP_IDEALS: Record<ClothingItemType | 'default', { ideal: number; tol: number }> = {
  jacket: { ideal: 6, tol: 10 },
  sweater: { ideal: 12, tol: 8 },
  pants: { ideal: 18, tol: 12 },
  dress: { ideal: 22, tol: 8 },
  shirt: { ideal: 20, tol: 8 },
  shoes: { ideal: 20, tol: 12 },
  accessory: { ideal: 20, tol: 15 },
  default: { ideal: 20, tol: 10 },
};
