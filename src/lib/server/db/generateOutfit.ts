import type { Outfit, ClothingItem, ClothingItemType, ClothingItemColor, UUID } from '$lib/types';
import { ClothingItemDAO } from './clotingItem';
import { getWeather } from '$lib/utils/weather';
import { randIntInclusive } from './outfitStrategies/utils';
import {
  getMonochromeOutfit,
  getAnalogueOutfit,
  getComplementaryOutfit,
  getTriadicOutfit,
} from './outfitStrategies';
import { color } from 'bun';

type OutfitWithoutId = Omit<Outfit, 'id'>;

export async function generateOutfit(userId: UUID): Promise<OutfitWithoutId> {
  const items = await ClothingItemDAO.getClothingItemsByUserId(userId);

  if (!items || items.length === 0) {
    throw new Error('Aucun vêtement trouvé pour cet utilisateur.');
  }

  const monochromeOutfit = getMonochromeOutfit(items);
  const analogousOutfit = getAnalogueOutfit(items);
  const complementaryOutfit = getComplementaryOutfit(items);
  const triadicOutfit = getTriadicOutfit(items);

  // Crée un tableau pour chaque type d'item
  const grouped: Record<ClothingItemType, ClothingItem[]> = {
    pants: [],
    sweater: [],
    dress: [],
    jacket: [],
    shirt: [],
    shoes: [],
    accessory: [],
  };

  for (const item of triadicOutfit) {
    grouped[item.type].push(item);
  }

  // Dress and shirts
  const combinedTops = [...grouped.shirt, ...grouped.dress];
  let top: ClothingItem[] = [];
  if (combinedTops.length > 0) {
    const randomIndex = Math.floor(Math.random() * combinedTops.length);
    top.push(combinedTops[randomIndex]);
  }

  const scoredItems = await scoring(items, 'default', top);

  // Pants (bottom)
  let bottom: ClothingItem | null = null;
  if (top[0]?.type === 'shirt' && grouped.pants.length > 0) {
    // Take random pant from top 10 scored pants, same for the next one
    const randomIndex = Math.floor(Math.random() * Math.min(10, grouped.pants.length));
    bottom = grouped.pants[randomIndex];
  } else if (top[0]?.type === 'dress') {
    bottom = null; // Une robe n'a pas de pantalon
  }

  // Shoes
  let shoes: ClothingItem | null = null;
  if (grouped.shoes.length > 0) {
    const randomIndex = Math.floor(Math.random() * Math.min(10, grouped.shoes.length));
    shoes = grouped.shoes[randomIndex];
  }

  // Accessories
  let accessories: ClothingItem[] = [];
  if (grouped.accessory.length > 0) {
    const accessoryMaxNum = Math.min(grouped.accessory.length, 3);
    const accessoryNum = randIntInclusive(0, accessoryMaxNum);

    // Pour éviter les doublons, on clone le tableau et on retire à chaque tirage
    const available = [...grouped.accessory];
    for (let i = 0; i < accessoryNum; i++) {
      if (available.length === 0) break;
      const randomIndex = Math.floor(Math.random() * available.length);
      accessories.push(available[randomIndex]);
      available.splice(randomIndex, 1);
    }
  }

  //TODO : rajouter les potentiels vestes/sweaters, etc.

  return {
    top,
    bottom,
    shoes,
    accessories,
    createdAt: new Date(),
    wornAt: [],
  };
}

/////////////////////////////////////////////////////////////////////////

async function scoring(
  items: ClothingItem[],
  profile: 'default' | 'comfort' | 'new' | 'style' | 'class' = 'default',
  top: ClothingItem
): Promise<ClothingItem[]> {
  const weather = await getWeather();
  if ('error' in weather) return items;

  const temp = Number.parseFloat(weather.temp || '0');
  const rain = Number.parseFloat(weather.rain || '0');
  const uv = Number.parseFloat(weather.uv || '0');

  // Définir les poids en fonction du profil
  let weights: Record<string, number>;
  switch (profile) {
    case 'comfort':
      weights = { temp: 0.3, rain: 0.3, uv: 0.2, lastWorn: 0.1, color: 0.1 };
      break;
    case 'new':
      weights = { temp: 0.2, rain: 0.2, uv: 0.1, lastWorn: 0.4, color: 0.1 };
      break;
    case 'style':
      weights = { temp: 0.1, rain: 0.2, uv: 0.2, lastWorn: 0.2, color: 0.3 };
      break;
    case 'class':
      weights = { temp: 0.1, rain: 0.1, uv: 0.1, lastWorn: 0.1, color: 0.6 };
      break;
    case 'default':
    default:
      weights = { temp: 0.2, rain: 0.2, uv: 0.2, lastWorn: 0.2, color: 0.2 };
      break;
  }

  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

  function getTempIdeal(type?: string): { ideal: number; tol: number } {
    const t = (type ?? '').toString().toLowerCase().trim();

    switch (t) {
      case 'jacket':
        return { ideal: 6, tol: 10 };
      case 'sweater':
        return { ideal: 12, tol: 8 };
      case 'pants':
        return { ideal: 18, tol: 12 };
      case 'dress':
        return { ideal: 22, tol: 8 };
      case 'shirt':
        return { ideal: 20, tol: 8 };
      case 'shoes':
        return { ideal: 20, tol: 12 };
      case 'accessory':
        return { ideal: 20, tol: 15 };
      default:
        return { ideal: 20, tol: 10 };
    }
  }

  function isWaterproof(item: ClothingItem) {
    const t = (item.type || '').toString().toLowerCase();
    if (t.includes('coat') || t.includes('rain')) return true;

    const d = (item.description || '').toString().toLowerCase();
    return d.includes('waterproof') || d.includes('impermeable') || d.includes('water repellent');
  }

  function getLastWornScore(lastWornAt: Date | null): number {
    if (!lastWornAt) return 1;
    //log function to favor items not worn recently (1 points for 30+ days)
    const days = Math.max(
      0,
      Math.floor((Date.now() - lastWornAt.getTime()) / (1000 * 60 * 60 * 24))
    );
    return clamp01(Math.log(days + 1) / Math.log(31));
  }

  function colorScoreForUV(color?: ClothingItemColor, uvVal: number = 0): number {
    const lightColors = ['white', 'yellow', 'pink', 'orange'];
    const neutralColors = ['black', 'gray', 'brown'];
    const chromatic = ['red', 'blue', 'green', 'purple'];

    const c = (color ?? '').toString().toLowerCase();
    let base = 0.5;
    if (lightColors.includes(c)) base = 0.8;
    else if (neutralColors.includes(c)) base = 0.6;
    else if (chromatic.includes(c)) base = 0.5;
    else base = 0.5;

    if (uvVal >= 3) {
      if (lightColors.includes(c)) base += 0.15;
      else if (chromatic.includes(c)) base -= 0.1;
    } else if (uvVal <= 1) {
      if (chromatic.includes(c)) base += 0.1;
      else if (lightColors.includes(c)) base -= 0.05;
    }
    return clamp01(base);
  }

  const scored = items.map((item) => {
    // temp
    const { ideal, tol } = getTempIdeal(item.type?.toString());
    const tempDiff = Math.abs(temp - ideal);
    const tempScore = clamp01(1 - tempDiff / Math.max(1, tol));

    // rain
    const rainScore = rain > 1 ? (isWaterproof(item) ? 1 : 0.2) : isWaterproof(item) ? 0.4 : 0.6;

    // uv colors
    const colUV = colorScoreForUV(item.color, uv);

    // last worn
    const lastScore = getLastWornScore((item as any).lastWornAt ?? null);

    const wTemp = tempScore * weights.temp;
    const wRain = rainScore * weights.rain;
    const wUV = colUV * weights.uv;
    const wLast = lastScore * weights.lastWorn;

    const norm = weights.temp + weights.rain + weights.uv + weights.lastWorn;
    const raw = wTemp + wRain + wUV + wLast;
    const score = norm > 0 ? clamp01(raw / norm) : 0;

    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.item);
}
