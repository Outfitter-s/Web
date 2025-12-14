import {
  type UUID,
  type ScoredClothingItem,
  type Weather,
  CLOTHING_STYLES,
  PROFILE_WEIGHTS,
  type ClothingStyles,
  type OutfitPreview,
  type ClothingItemType,
} from '$lib/types';
import { ClothingItemDAO } from './clothingItem';
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

export class OutfitGenerator {
  static getItemsOfType(items: ScoredClothingItem[], type: ClothingItemType): ScoredClothingItem[] {
    return items.filter((item) => item.type === type);
  }

  static selectRandomFromTop(
    items: ScoredClothingItem[],
    count: number = 3
  ): ScoredClothingItem | null {
    if (items.length === 0) return null;
    const topItems = items.slice(0, Math.min(count, items.length));
    return topItems[Math.floor(Math.random() * topItems.length)];
  }

  static scoreItems(
    scored: ScoredClothingItem[],
    baseItem: ScoredClothingItem | null,
    weather: Weather,
    weights: (typeof PROFILE_WEIGHTS)[ClothingStyles]
  ): void {
    for (const item of scored) {
      item.score += lastWornScore(item) * weights.lastWorn;

      if (baseItem) {
        item.score += monochromeScore(baseItem, item);
        item.score += complementaryScore(baseItem, item);
        item.score += analogousScore(baseItem, item);
        item.score += triadicScore(baseItem, item);
      }

      if (!('error' in weather)) {
        item.score += colorForUVScore(item, weather) * weights.uv;
        item.score += tempScore(item, weather) * weights.temp;
        item.score += rainScore(item, weather) * weights.rain;
      }
    }
  }
}

export async function generateOutfits(
  userId: UUID,
  weather: Weather,
  count: number,
  { style = CLOTHING_STYLES[0] }: { style?: ClothingStyles } = {}
): Promise<OutfitPreview[]> {
  const outfits: OutfitPreview[] = [];
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
): Promise<OutfitPreview> {
  const wardrobe = await ClothingItemDAO.getClothingItemsByUserId(userId);
  const chooseBetween = 3;

  if (!wardrobe || wardrobe.length === 0) {
    throw new Error('errors.outfitGeneration.notEnoughItems');
  }

  // Add score to items
  const scored: ScoredClothingItem[] = wardrobe.map((item) => ({
    ...item,
    score: 0,
  }));

  // Get a random top (shirt or dress)
  const tops = OutfitGenerator.getItemsOfType(scored, 'shirt').concat(
    OutfitGenerator.getItemsOfType(scored, 'dress')
  );
  const selectedTop = tops.length > 0 ? tops[Math.floor(Math.random() * tops.length)] : null;

  const weights = PROFILE_WEIGHTS[style];

  // Score all items based on selected top and weather
  OutfitGenerator.scoreItems(scored, selectedTop ?? null, weather, weights);

  // Sort by score
  scored.sort((a, b) => b.score - a.score);

  // Build outfit
  const outfitItems: ScoredClothingItem[] = [];

  // Add selected top
  if (selectedTop) {
    outfitItems.push(selectedTop);
  }

  // Add bottom (pants) if wearing a shirt
  if (selectedTop?.type === 'shirt') {
    const pants = OutfitGenerator.getItemsOfType(scored, 'pants');
    const selectedPants = OutfitGenerator.selectRandomFromTop(pants, chooseBetween);
    if (selectedPants) {
      outfitItems.push(selectedPants);
    }
  }

  // Add shoes
  const shoes = OutfitGenerator.getItemsOfType(scored, 'shoes');
  const selectedShoes = OutfitGenerator.selectRandomFromTop(shoes, chooseBetween);
  if (selectedShoes) {
    outfitItems.push(selectedShoes);
  }

  // Add accessories
  const accessories = OutfitGenerator.getItemsOfType(scored, 'accessory');
  const selectedAccessories = selectRandomAccessories(accessories, 3);
  outfitItems.push(...selectedAccessories);

  // Add extra layer if cold or rainy
  const tempThreshold = 20;
  if (weather.temp < tempThreshold || weather.rain > 1) {
    const jackets = OutfitGenerator.getItemsOfType(scored, 'jacket');
    const sweaters = OutfitGenerator.getItemsOfType(scored, 'sweater');

    let extraTop: ScoredClothingItem | null = null;
    if (jackets.length > 0) {
      extraTop = OutfitGenerator.selectRandomFromTop(jackets, chooseBetween);
    } else if (sweaters.length > 0) {
      extraTop = OutfitGenerator.selectRandomFromTop(sweaters, chooseBetween);
    }

    if (extraTop) {
      outfitItems.push(extraTop);
    }
  }

  return {
    items: outfitItems,
  };
}
