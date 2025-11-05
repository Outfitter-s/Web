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
