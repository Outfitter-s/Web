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

class OutfitUtils {
  static getItemsOfType(items: ScoredClothingItem[], type: ClothingItemType): ScoredClothingItem[] {
    return items.filter((item) => item.type === type);
  }

  static selectRandomFromTop(
    items: ScoredClothingItem[],
    count: number = 3,
    randomnessMultiplier: number = 1
  ): ScoredClothingItem | null {
    if (items.length === 0) return null;
    const expandedCount = Math.min(count * randomnessMultiplier, items.length);
    const topItems = items.slice(0, expandedCount);
    return topItems[Math.floor(Math.random() * topItems.length)];
  }

  static scoreItems(
    scored: ScoredClothingItem[],
    baseItem: ScoredClothingItem | null,
    weather: Weather,
    weights: (typeof PROFILE_WEIGHTS)[ClothingStyles],
    colorHarmonyWeight: number = 1,
    diversityPenalty: number = 0,
    excludeTopIds: Set<UUID> = new Set()
  ): void {
    for (const item of scored) {
      item.score += lastWornScore(item) * weights.lastWorn;

      // Penalize recently used tops to force diversity
      if ((item.type === 'shirt' || item.type === 'dress') && excludeTopIds.has(item.id)) {
        item.score -= diversityPenalty;
      }

      if (baseItem) {
        item.score += monochromeScore(baseItem, item) * colorHarmonyWeight;
        item.score += complementaryScore(baseItem, item) * colorHarmonyWeight;
        item.score += analogousScore(baseItem, item) * colorHarmonyWeight;
        item.score += triadicScore(baseItem, item) * colorHarmonyWeight;
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
  const wardrobe = await ClothingItemDAO.getClothingItemsByUserId(userId);

  if (!wardrobe || wardrobe.length === 0) {
    throw new Error('errors.outfitGeneration.notEnoughItems');
  }

  const outfits: OutfitPreview[] = [];
  const usedTopIds = new Set<UUID>();

  for (let i = 0; i < count; i++) {
    // Increase diversity penalty with each outfit
    const diversityPenalty = i * 0.3;
    const colorHarmonyWeight = Math.max(0.3, 1 - i * 0.2); // Reduce color harmony importance over iterations
    const outfit = await generateOutfit(userId, weather, {
      style,
      diversityPenalty,
      colorHarmonyWeight,
      usedTopIds,
    });
    outfits.push(outfit);

    // Track used top to avoid repeating the primary piece
    const topItem = outfit.items.find((item) => item.type === 'shirt' || item.type === 'dress');
    if (topItem) {
      usedTopIds.add(topItem.id);
    }
  }

  return outfits;
}

export async function generateOutfit(
  userId: UUID,
  weather: Weather,
  {
    style = CLOTHING_STYLES[0],
    randomnessMultiplier = 1,
    diversityPenalty = 0,
    colorHarmonyWeight = 1,
    usedTopIds = new Set(),
  }: {
    style?: ClothingStyles;
    randomnessMultiplier?: number;
    diversityPenalty?: number;
    colorHarmonyWeight?: number;
    usedTopIds?: Set<UUID>;
  } = {}
): Promise<OutfitPreview> {
  const wardrobe = await ClothingItemDAO.getClothingItemsByUserId(userId);
  const chooseBetween = 3;

  if (!wardrobe || wardrobe.length === 0) {
    throw new Error('errors.outfitGeneration.notEnoughItems');
  }

  // Add score to items with randomness to force diversity
  const scored: ScoredClothingItem[] = wardrobe.map((item) => ({
    ...item,
    score: Math.random() * randomnessMultiplier,
  }));

  // Get a random top (shirt or dress) from a wider pool for more diversity
  const tops = OutfitUtils.getItemsOfType(scored, 'shirt').concat(
    OutfitUtils.getItemsOfType(scored, 'dress')
  );
  const selectedTop =
    tops.length > 0
      ? OutfitUtils.selectRandomFromTop(tops, tops.length, randomnessMultiplier)
      : null;

  const weights = PROFILE_WEIGHTS[style];

  // Score all items based on selected top and weather
  OutfitUtils.scoreItems(
    scored,
    selectedTop ?? null,
    weather,
    weights,
    colorHarmonyWeight,
    diversityPenalty,
    usedTopIds
  );

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
    const pants = OutfitUtils.getItemsOfType(scored, 'pants');
    const selectedPants = OutfitUtils.selectRandomFromTop(
      pants,
      chooseBetween,
      randomnessMultiplier
    );
    if (selectedPants) {
      outfitItems.push(selectedPants);
    }
  }

  // Add shoes
  const shoes = OutfitUtils.getItemsOfType(scored, 'shoes');
  const selectedShoes = OutfitUtils.selectRandomFromTop(shoes, chooseBetween, randomnessMultiplier);
  if (selectedShoes) {
    outfitItems.push(selectedShoes);
  }

  // Add accessories
  const accessories = OutfitUtils.getItemsOfType(scored, 'accessory');
  const selectedAccessories = selectRandomAccessories(accessories, 3);
  outfitItems.push(...selectedAccessories);

  // Add extra layer if cold or rainy
  const tempThreshold = 20;
  if (weather.temp < tempThreshold || weather.rain > 1) {
    const jackets = OutfitUtils.getItemsOfType(scored, 'jacket');
    const sweaters = OutfitUtils.getItemsOfType(scored, 'sweater');

    let extraTop: ScoredClothingItem | null = null;
    if (jackets.length > 0) {
      extraTop = OutfitUtils.selectRandomFromTop(jackets, chooseBetween, randomnessMultiplier);
    } else if (sweaters.length > 0) {
      extraTop = OutfitUtils.selectRandomFromTop(sweaters, chooseBetween, randomnessMultiplier);
    }

    if (extraTop) {
      outfitItems.push(extraTop);
    }
  }

  return {
    items: outfitItems,
  };
}
