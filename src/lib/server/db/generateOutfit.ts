import type { Outfit, ClothingItem, ClothingItemType, ClothingItemColor, UUID } from '$lib/types';
import { ClothingItemDAO } from './clotingItem';
import { getWeather } from '$lib/utils/weather';

type OutfitWithoutId = Omit<Outfit, 'id'>;

function generateColorWheel(): ClothingItemColor[] {
  // Définir l'ordre chromatique idéal
  const chromaticOrder: ClothingItemColor[] = [
    'red',
    'orange',
    'yellow',
    'green',
    'blue',
    'purple',
    'pink',
  ];

  // Couleurs neutres (séparées car elles vont avec tout)
  const neutralColors: ClothingItemColor[] = ['white', 'black', 'gray', 'brown'];

  // Combine chromatic order with neutral colors at the end
  return [...chromaticOrder, ...neutralColors];
}

const COLOR_WHEEL = generateColorWheel();

export async function generateOutfit(userId: UUID): Promise<OutfitWithoutId> {
  const items = await ClothingItemDAO.getClothingItemsByUserId(userId);

  const weather = await getWeather();

  const monochromeOutfit = getMonochromeOutfit(items);

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

  for (const item of monochromeOutfit) {
    grouped[item.type].push(item);
  }

  // Dress and shirts
  const combinedTops = [...grouped.shirt, ...grouped.dress];
  let top: ClothingItem[] = [];
  if (combinedTops.length > 0) {
    const randomIndex = Math.floor(Math.random() * combinedTops.length);
    top.push(combinedTops[randomIndex]);
  }

  // Pants (bottom)
  let bottom: ClothingItem | null = null;
  if (top[0]?.type === 'shirt' && grouped.pants.length > 0) {
    const randomIndex = Math.floor(Math.random() * grouped.pants.length);
    bottom = grouped.pants[randomIndex];
  } else if (top[0]?.type === 'dress') {
    bottom = null; // Une robe n'a pas de pantalon
  }

  // Shoes
  let shoes: ClothingItem | null = null;
  if (grouped.shoes.length > 0) {
    const randomIndex = Math.floor(Math.random() * grouped.shoes.length);
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

  return {
    top,
    bottom,
    shoes,
    accessories,
    createdAt: new Date(),
    wornAt: [],
  };
}

// renvoie un entier aléatoire entre min et max (les deux inclus)
function randIntInclusive(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  if (max < min) return min;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function scoring(userId: UUID): Promise<ClothingItem[]> {
  const items = await ClothingItemDAO.getClothingItemsByUserId(userId);

  const weather = await getWeather();

  // Si météo indisponible, renvoyer les items sans scoring
  if ('error' in weather) return items;

  const temp = Number.parseFloat(weather.temp || '0');
  const rain = Number.parseFloat(weather.rain || '0');
  const uv = Number.parseFloat(weather.uv || '0');

  // TODO : Continuer scoring
  // Multiplicateurs utilisateur (tous à 1 par défaut)
  const multipliers = { temp: 1, rain: 1, color: 1, lastWorn: 1 };
  const weights = { temp: 0.6, rain: 0.2, color: 0.1, lastWorn: 0.1 }; // simple pondération

  ////////////////////////////////////////////////////////////////////////////////////////////////////////

  //TODO : Scoring pour la température en fonction du type ET du titre/desc
  //TODO : Scoring pour la couleur en fonction de la saison / météo
  //TODO : Scoring pour la dernière fois porté

  const isWaterproof = (item: ClothingItem) => {
    const t = (item.type || '').toString().toLowerCase();
    if (t.includes('coat') || t.includes('rain')) return true;

    const d = (item.description || '').toString().toLowerCase();
    return d.includes('waterproof') || d.includes('impermeable') || d.includes('water repellent');
  };

  const colorScore = (_: ClothingItem) => 0.5; // placeholder neutre

  // clamp01 : force une valeur entre 0 et 1 pour éviter les débordements
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
  const scored = items.map((item) => {
    const rainScore = rain > 1 ? (isWaterproof(item) ? 1 : 0.2) : isWaterproof(item) ? 0.4 : 0.6;

    const colScore = colorScore(item);

    //const wTemp = tempScore * weights.temp * multipliers.temp;
    const wRain = rainScore * weights.rain * multipliers.rain;
    const wColor = colScore * weights.color * multipliers.color;

    const norm =
      weights.temp * multipliers.temp +
      weights.rain * multipliers.rain +
      weights.color * multipliers.color +
      weights.lastWorn * multipliers.lastWorn;
    const score = norm > 0 ? clamp01((wRain + wColor) / norm) : 0;

    return { item, score };
  });

  // Trier par score décroissant les items
  // Ne fait pas de tenue à proprement parler, juste un classement pour en créer
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.item);
}

function getMonochromeOutfit(items: ClothingItem[]): ClothingItem[] {
  type ByType = Record<ClothingItemType, ClothingItem[]>;
  const emptyByType = (): ByType => ({
    pants: [],
    sweater: [],
    dress: [],
    jacket: [],
    shirt: [],
    shoes: [],
    accessory: [],
  });

  // Regrouper par couleur puis par type
  const byColor: Record<string, ByType> = {};
  for (const item of items) {
    (byColor[item.color] ??= emptyByType())[item.type].push(item);
  }

  const colors = Object.keys(byColor) as ClothingItemColor[];
  if (colors.length === 0) return [];

  // Fonction helper pour vérifier si une couleur a un outfit valide
  const hasTop = (bt: ByType) => bt.shirt.length + bt.dress.length > 0;

  // Trier les couleurs disponibles selon leur position dans COLOR_WHEEL
  // Les couleurs plus tôt dans COLOR_WHEEL ont la priorité
  const sortedColors = colors.sort((a, b) => {
    const indexA = COLOR_WHEEL.indexOf(a);
    const indexB = COLOR_WHEEL.indexOf(b);
    // Si une couleur n'est pas dans COLOR_WHEEL, la mettre à la fin
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  // Trouver la meilleure couleur selon COLOR_WHEEL avec top + shoes
  let baseColor = sortedColors.find((c) => hasTop(byColor[c]) && byColor[c].shoes.length > 0);

  // Si aucune couleur avec shoes, prendre celle avec top seulement
  if (!baseColor) {
    baseColor = sortedColors.find((c) => hasTop(byColor[c]));
  }

  // Fallback : n'importe quelle couleur
  if (!baseColor) {
    baseColor = sortedColors[0];
  }

  const group = byColor[baseColor];
  const outfit: ClothingItem[] = [];

  // Top (shirt ou dress)
  const combinedTops = [...group.shirt, ...group.dress];
  if (combinedTops.length > 0) {
    const top = combinedTops[Math.floor(Math.random() * combinedTops.length)];
    outfit.push(top);

    // Pants (seulement si top est une shirt)
    if (top.type === 'shirt' && group.pants.length > 0) {
      const pant = group.pants[Math.floor(Math.random() * group.pants.length)];
      outfit.push(pant);
    }
  }

  // Shoes
  if (group.shoes.length > 0) {
    const shoes = group.shoes[Math.floor(Math.random() * group.shoes.length)];
    outfit.push(shoes);
  }

  // Accessories (0..3), sans doublon
  if (group.accessory.length > 0) {
    const maxNum = Math.min(group.accessory.length, 3);
    const count = randIntInclusive(0, maxNum);
    const pool = [...group.accessory];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      outfit.push(pool[idx]);
      pool.splice(idx, 1);
    }
  }

  return outfit;
}
