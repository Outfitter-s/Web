import {
  type Outfit,
  type ClothingItemType,
  type UUID,
  type ScoredClothingItem,
  type Weather,
  CLOTHING_STYLES,
  PROFILE_WEIGHTS,
  type ClothingStyles,
} from '$lib/types';
import { ClothingItemDAO } from './clotingItem';
import { selectRandomAccessories } from './outfitStrategies/utils';
import {
  lastWornScore,
  colorForUVScore,
  rainScore,
  tempScore,
  monochromeScore,
  complementaryScore,
  analogousScore,
  triadicScore,
} from './outfitStrategies';

type OutfitWithoutId = Omit<Outfit, 'id'>;

export async function generateOutfits(
  userId: UUID,
  weather: Weather,
  count: number,
  { style = CLOTHING_STYLES[0] }: { style?: ClothingStyles } = {}
): Promise<OutfitWithoutId[]> {
  const outfits: OutfitWithoutId[] = [];
  for (let i = 0; i < count; i++) {
    const outfit = await generateOutfit(userId, weather, { style });
    outfits.push(outfit);
  }
  return outfits;
}

export async function generateOutfit(
  userId: UUID,
  weather: Weather,
  { style = CLOTHING_STYLES[0] }: { style: ClothingStyles }
): Promise<OutfitWithoutId> {
  const items = await ClothingItemDAO.getClothingItemsByUserId(userId);
  const chooseBetween = 3;

  if (!items || items.length === 0) {
    throw new Error('errors.outfitGeneration.notEnoughItems');
  }

  // Add temp score to items
  const scored: ScoredClothingItem[] = items.map((item) => ({
    ...item,
    score: 0,
  }));

  // Get a random top
  const tops: ScoredClothingItem[] = scored.filter(
    (item) => item.type === 'dress' || item.type === 'shirt'
  );

  const top: ScoredClothingItem[] = [];
  if (tops.length > 0) {
    const randomIndex = Math.floor(Math.random() * tops.length);
    top.push(tops[randomIndex]);
  }

  const weights = PROFILE_WEIGHTS[style];

  // For loop over each item
  for (const item of scored) {
    // Use scoring functions between choosen top and actuel item
    item.score += lastWornScore(item) * weights.lastWorn;
    item.score += monochromeScore(top[0], item);
    item.score += complementaryScore(top[0], item);
    item.score += analogousScore(top[0], item);
    item.score += triadicScore(top[0], item);

    if ('error' in weather) break;
    item.score += colorForUVScore(item, weather) * weights.uv;
    item.score += tempScore(item, weather) * weights.temp;
    item.score += rainScore(item, weather) * weights.rain;
  }

  // Sort by score
  scored.sort((a, b) => b.score - a.score);

  // Sort items by types
  const grouped: Record<ClothingItemType, ScoredClothingItem[]> = {
    pants: [],
    sweater: [],
    dress: [],
    jacket: [],
    shirt: [],
    shoes: [],
    accessory: [],
  };

  for (const item of scored) {
    if (item.type !== 'shirt' && item.type !== 'dress') {
      grouped[item.type].push(item);
    }
  }

  // Choose for each type the item

  // Pants (bottom)
  let bottom: ScoredClothingItem | null = null;
  if (top[0]?.type === 'shirt' && grouped.pants.length > 0) {
    // Take random pant from top 10 scored pants, same for the next one
    const randomIndex = Math.floor(Math.random() * Math.min(chooseBetween, grouped.pants.length));
    bottom = grouped.pants[randomIndex];
  } else if (top[0]?.type === 'dress') {
    bottom = null; // Une robe n'a pas de pantalon
  }

  // Shoes
  let shoes: ScoredClothingItem | null = null;
  if (grouped.shoes.length > 0) {
    const randomIndex = Math.floor(Math.random() * Math.min(chooseBetween, grouped.shoes.length));
    shoes = grouped.shoes[randomIndex];
  }

  // Accessories
  let accessories: ScoredClothingItem[] = [];
  if (grouped.accessory.length > 0) {
    accessories = selectRandomAccessories(grouped.accessory, 3);
  }

  const tempThreshold = 20;

  if (weather.temp < tempThreshold || weather.rain > 1) {
    let extraTop: ScoredClothingItem | undefined;
    if (grouped.jacket.length > 0) {
      const randomIndex = Math.floor(
        Math.random() * Math.min(chooseBetween, grouped.jacket.length)
      );
      extraTop = grouped.jacket[randomIndex];
    } else if (grouped.sweater.length > 0) {
      const randomIndex = Math.floor(
        Math.random() * Math.min(chooseBetween, grouped.sweater.length)
      );
      extraTop = grouped.sweater[randomIndex];
    }
    if (extraTop) {
      top.push(extraTop);
    }
  }

  return {
    top,
    bottom,
    shoes,
    accessories,
    createdAt: new Date(),
    wornAt: [],
  };
}
