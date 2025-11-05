import type { Outfit, ClothingItem, ClothingItemType, ClothingItemColor, UUID } from '$lib/types';
import { ClothingItemDAO } from './clotingItem';
import { getWeather } from '$lib/utils/weather';
import { color } from 'bun';

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

  if (!items || items.length === 0) {
    throw new Error("Aucun vêtement trouvé pour cet utilisateur.");
  }

  const monochromeOutfit = getMonochromeOutfit(items);
  const analogousOutfit = getAnalogueOutfit(items);
  const complementaryOutfit = getComplementaryOutfit(items);

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

  for (const item of complementaryOutfit) {
    grouped[item.type].push(item);
  }

  // Dress and shirts
  const combinedTops = [...grouped.shirt, ...grouped.dress];
  let top: ClothingItem[] = [];
  if (combinedTops.length > 0) {
    const randomIndex = Math.floor(Math.random() * combinedTops.length);
    top.push(combinedTops[randomIndex]);
  }

  const scoredItems = await scoring(items, "default", top);

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

// renvoie un entier aléatoire entre min et max (les deux inclus)
function randIntInclusive(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  if (max < min) return min;
  return Math.floor(Math.random() * (max - min + 1)) + min;
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

  // Définir les couleurs neutres
  const neutralColors: ClothingItemColor[] = ['white', 'black', 'gray', 'brown'];

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
  const sortedColors = colors.sort((a, b) => {
    const indexA = COLOR_WHEEL.indexOf(a);
    const indexB = COLOR_WHEEL.indexOf(b);
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
    if (top.type === 'shirt') {
      if (group.pants.length > 0) {
        // Prendre un pantalon de la couleur principale
        const pant = group.pants[Math.floor(Math.random() * group.pants.length)];
        outfit.push(pant);
      } else {
        // Chercher un pantalon dans les couleurs neutres disponibles
        const neutralPantsAvailable = neutralColors.filter(
          (c) => byColor[c] && byColor[c].pants.length > 0
        );

        if (neutralPantsAvailable.length > 0) {
          const neutralColor =
            neutralPantsAvailable[Math.floor(Math.random() * neutralPantsAvailable.length)];
          const pant =
            byColor[neutralColor].pants[
              Math.floor(Math.random() * byColor[neutralColor].pants.length)
            ];
          outfit.push(pant);
        }
      }
    }
  }

  // Shoes - essayer d'abord la couleur de base, sinon prendre une couleur neutre
  if (group.shoes.length > 0) {
    const shoes = group.shoes[Math.floor(Math.random() * group.shoes.length)];
    outfit.push(shoes);
  } else {
    // Chercher des chaussures dans les couleurs neutres disponibles
    const neutralShoesAvailable = neutralColors.filter(
      (c) => byColor[c] && byColor[c].shoes.length > 0
    );

    if (neutralShoesAvailable.length > 0) {
      const neutralColor =
        neutralShoesAvailable[Math.floor(Math.random() * neutralShoesAvailable.length)];
      const shoes =
        byColor[neutralColor].shoes[Math.floor(Math.random() * byColor[neutralColor].shoes.length)];
      outfit.push(shoes);
    }
  }

  // Accessories (0..3), sans doublon - essayer couleur de base puis neutres
  const availableAccessories = [...group.accessory];

  // Ajouter les accessoires neutres disponibles
  for (const neutralColor of neutralColors) {
    if (byColor[neutralColor] && neutralColor !== baseColor) {
      availableAccessories.push(...byColor[neutralColor].accessory);
    }
  }

  if (availableAccessories.length > 0) {
    const maxNum = Math.min(availableAccessories.length, 3);
    const count = randIntInclusive(0, maxNum);
    const pool = [...availableAccessories];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      outfit.push(pool[idx]);
      pool.splice(idx, 1);
    }
  }

  return outfit;
}

function getAnalogousColors(color: ClothingItemColor, distance: number = 1): ClothingItemColor[] {
  const neutralColors: ClothingItemColor[] = ['white', 'black', 'gray', 'brown'];

  const index = COLOR_WHEEL.indexOf(color);

  // Si la couleur n'est pas trouvée, retourner seulement cette couleur
  if (index === -1) {
    return [color];
  }

  // Si c'est une couleur neutre, elle va avec toutes les couleurs chromatiques
  if (neutralColors.includes(color)) {
    const chromaticColors = COLOR_WHEEL.filter((c) => !neutralColors.includes(c));
    return [color, ...chromaticColors];
  }

  const analogousColors: ClothingItemColor[] = [color];

  // Ajouter les couleurs voisines dans les deux directions
  for (let i = 1; i <= distance; i++) {
    // Couleur précédente (avec gestion circulaire)
    const prevIndex = (index - i + COLOR_WHEEL.length) % COLOR_WHEEL.length;
    const prevColor = COLOR_WHEEL[prevIndex];
    // Éviter les couleurs neutres comme voisines directes
    if (!neutralColors.includes(prevColor)) {
      analogousColors.push(prevColor);
    }

    // Couleur suivante (avec gestion circulaire)
    const nextIndex = (index + i) % COLOR_WHEEL.length;
    const nextColor = COLOR_WHEEL[nextIndex];
    if (!neutralColors.includes(nextColor)) {
      analogousColors.push(nextColor);
    }
  }

  return analogousColors;
}

function getAnalogueOutfit(items: ClothingItem[]): ClothingItem[] {
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

  const neutralColors: ClothingItemColor[] = ['white', 'black', 'gray', 'brown'];

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
  const sortedColors = colors.sort((a, b) => {
    const indexA = COLOR_WHEEL.indexOf(a);
    const indexB = COLOR_WHEEL.indexOf(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  // Trouver une couleur de base qui a au moins un top
  let baseColor = sortedColors.find((c) => hasTop(byColor[c]));
  if (!baseColor) {
    baseColor = sortedColors[0];
  }

  // Obtenir les couleurs analogues (voisines)
  const analogousColors = getAnalogousColors(baseColor, 1);

  // Filtrer pour ne garder que les couleurs analogues disponibles dans la garde-robe
  const availableAnalogousColors = analogousColors.filter((c) => colors.includes(c));

  const outfit: ClothingItem[] = [];

  // Top : priorité à la couleur de base
  let topAdded = false;
  if (byColor[baseColor].shirt.length > 0 || byColor[baseColor].dress.length > 0) {
    const combinedTops = [...byColor[baseColor].shirt, ...byColor[baseColor].dress];
    const top = combinedTops[Math.floor(Math.random() * combinedTops.length)];
    outfit.push(top);
    topAdded = true;

    // Pants : peut être de la couleur de base OU d'une couleur analogue
    if (top.type === 'shirt') {
      // Collecter tous les pantalons des couleurs analogues disponibles
      const allPants: ClothingItem[] = [];
      for (const color of availableAnalogousColors) {
        allPants.push(...byColor[color].pants);
      }

      if (allPants.length > 0) {
        const pant = allPants[Math.floor(Math.random() * allPants.length)];
        outfit.push(pant);
      } else {
        // Fallback : pantalon neutre
        const neutralPantsAvailable = neutralColors.filter(
          (c) => byColor[c] && byColor[c].pants.length > 0
        );
        if (neutralPantsAvailable.length > 0) {
          const neutralColor =
            neutralPantsAvailable[Math.floor(Math.random() * neutralPantsAvailable.length)];
          const pant =
            byColor[neutralColor].pants[
              Math.floor(Math.random() * byColor[neutralColor].pants.length)
            ];
          outfit.push(pant);
        }
      }
    }
  }

  // Si pas de top dans la couleur de base, essayer les couleurs analogues
  if (!topAdded) {
    for (const color of availableAnalogousColors) {
      const combinedTops = [...byColor[color].shirt, ...byColor[color].dress];
      if (combinedTops.length > 0) {
        const top = combinedTops[Math.floor(Math.random() * combinedTops.length)];
        outfit.push(top);
        topAdded = true;

        if (top.type === 'shirt' && byColor[color].pants.length > 0) {
          const pant =
            byColor[color].pants[Math.floor(Math.random() * byColor[color].pants.length)];
          outfit.push(pant);
        }
        break;
      }
    }
  }

  // Shoes : de préférence dans les couleurs analogues
  const allShoes: ClothingItem[] = [];
  for (const color of availableAnalogousColors) {
    allShoes.push(...byColor[color].shoes);
  }

  if (allShoes.length > 0) {
    const shoes = allShoes[Math.floor(Math.random() * allShoes.length)];
    outfit.push(shoes);
  } else {
    // Fallback : chaussures neutres
    const neutralShoesAvailable = neutralColors.filter(
      (c) => byColor[c] && byColor[c].shoes.length > 0
    );
    if (neutralShoesAvailable.length > 0) {
      const neutralColor =
        neutralShoesAvailable[Math.floor(Math.random() * neutralShoesAvailable.length)];
      const shoes =
        byColor[neutralColor].shoes[Math.floor(Math.random() * byColor[neutralColor].shoes.length)];
      outfit.push(shoes);
    }
  }

  // Accessories : mélange des couleurs analogues + neutres
  const allAccessories: ClothingItem[] = [];
  for (const color of availableAnalogousColors) {
    allAccessories.push(...byColor[color].accessory);
  }
  // Ajouter les accessoires neutres
  for (const neutralColor of neutralColors) {
    if (byColor[neutralColor]) {
      allAccessories.push(...byColor[neutralColor].accessory);
    }
  }

  if (allAccessories.length > 0) {
    const maxNum = Math.min(allAccessories.length, 3);
    const count = randIntInclusive(0, maxNum);
    const pool = [...allAccessories];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      outfit.push(pool[idx]);
      pool.splice(idx, 1);
    }
  }

  return outfit;
}

/////////////////////////////////////////////////////////////////////////

async function scoring(items: ClothingItem[], profile: 'default' | 'comfort' | 'new' | 'style' | 'class' = 'default', top: ClothingItem): Promise<ClothingItem[]> {
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

function getComplementaryColor(color: ClothingItemColor): ClothingItemColor {
  const neutralColors: ClothingItemColor[] = ['white', 'black', 'gray', 'brown'];

  // Si c'est une couleur neutre, retourner une couleur chromatique aléatoire
  if (neutralColors.includes(color)) {
    const chromaticColors = COLOR_WHEEL.filter((c) => !neutralColors.includes(c));
    return chromaticColors[Math.floor(Math.random() * chromaticColors.length)];
  }

  const index = COLOR_WHEEL.indexOf(color);
  if (index === -1) return color;

  // Calculer l'index de la couleur complémentaire
  // Sur une roue de 7 couleurs chromatiques, l'opposé est à +3 ou +4 positions
  const chromaticColors = COLOR_WHEEL.filter((c) => !neutralColors.includes(c));
  const chromaticIndex = chromaticColors.indexOf(color);

  if (chromaticIndex === -1) return color;

  // Position opposée : ajouter la moitié du nombre de couleurs (arrondi)
  const complementaryIndex =
    (chromaticIndex + Math.floor(chromaticColors.length / 2)) % chromaticColors.length;

  return chromaticColors[complementaryIndex];
}

function getComplementaryColors(color: ClothingItemColor): ClothingItemColor[] {
  const neutralColors: ClothingItemColor[] = ['white', 'black', 'gray', 'brown'];

  if (neutralColors.includes(color)) {
    const chromaticColors = COLOR_WHEEL.filter((c) => !neutralColors.includes(c));
    return chromaticColors;
  }

  const complementary = getComplementaryColor(color);
  const complementaryIndex = COLOR_WHEEL.indexOf(complementary);

  if (complementaryIndex === -1) return [color, complementary];

  // Ajouter les couleurs voisines de la complémentaire pour plus de variété
  const colors: ClothingItemColor[] = [color, complementary];

  // Couleur avant la complémentaire
  const prevIndex = (complementaryIndex - 1 + COLOR_WHEEL.length) % COLOR_WHEEL.length;
  const prevColor = COLOR_WHEEL[prevIndex];
  if (!neutralColors.includes(prevColor)) {
    colors.push(prevColor);
  }

  // Couleur après la complémentaire
  const nextIndex = (complementaryIndex + 1) % COLOR_WHEEL.length;
  const nextColor = COLOR_WHEEL[nextIndex];
  if (!neutralColors.includes(nextColor)) {
    colors.push(nextColor);
  }

  return colors;
}

function getComplementaryOutfit(items: ClothingItem[]): ClothingItem[] {
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

  const neutralColors: ClothingItemColor[] = ['white', 'black', 'gray', 'brown'];

  // Regrouper par couleur puis par type
  const byColor: Record<string, ByType> = {};
  for (const item of items) {
    (byColor[item.color] ??= emptyByType())[item.type].push(item);
  }

  const colors = Object.keys(byColor) as ClothingItemColor[];
  if (colors.length === 0) return [];

  // Fonction helper pour vérifier si une couleur a un outfit valide
  const hasTop = (bt: ByType) => bt.shirt.length + bt.dress.length > 0;
  const hasPants = (bt: ByType) => bt.pants.length > 0;

  // Trier les couleurs disponibles selon leur position dans COLOR_WHEEL
  const sortedColors = colors.sort((a, b) => {
    const indexA = COLOR_WHEEL.indexOf(a);
    const indexB = COLOR_WHEEL.indexOf(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  // Trouver une couleur de base qui a au moins un top
  let baseColor = sortedColors.find((c) => hasTop(byColor[c]));
  if (!baseColor) {
    baseColor = sortedColors[0];
  }

  // Obtenir les couleurs complémentaires
  const complementaryColors = getComplementaryColors(baseColor);

  // Filtrer pour ne garder que les couleurs complémentaires disponibles
  const availableComplementaryColors = complementaryColors.filter((c) => colors.includes(c));

  const baseHasTop = hasTop(byColor[baseColor]);
  const baseHasPants = hasPants(byColor[baseColor]);

  // Vérifier si les couleurs complémentaires (hors base) ont des tops et pantalons
  const complementaryHasTop = availableComplementaryColors
    .filter((c) => c !== baseColor)
    .some((c) => hasTop(byColor[c]));
  const complementaryHasPants = availableComplementaryColors
    .filter((c) => c !== baseColor)
    .some((c) => hasPants(byColor[c]));

  // Décider de la stratégie :
  // - Si base a top ET complémentaire a pants → normal (base=top, comp=pants)
  // - Si complémentaire a top ET base a pants → inversé (comp=top, base=pants)
  // - Sinon choisir aléatoirement
  let useInvertedStrategy = false;

  if (baseHasTop && complementaryHasPants && complementaryHasTop && baseHasPants) {
    // Les deux stratégies sont possibles choisir aléatoirement
    useInvertedStrategy = Math.random() > 0.5;
  } else if (complementaryHasTop && baseHasPants && !baseHasTop) {
    useInvertedStrategy = true;
  } else if (baseHasTop && complementaryHasPants) {
    useInvertedStrategy = false;
  } else {
    // Aucune des deux n'est idéale on fait de notre mieux
    useInvertedStrategy = Math.random() > 0.5;
  }

  const outfit: ClothingItem[] = [];

  // Définir les couleurs pour top et bottom selon la stratégie
  const topColors = useInvertedStrategy
    ? availableComplementaryColors.filter((c) => c !== baseColor)
    : [baseColor];

  const bottomColors = useInvertedStrategy
    ? [baseColor]
    : availableComplementaryColors.filter((c) => c !== baseColor);

  // Top : essayer les couleurs définies
  let topAdded = false;
  for (const color of topColors) {
    if (byColor[color] && (byColor[color].shirt.length > 0 || byColor[color].dress.length > 0)) {
      const combinedTops = [...byColor[color].shirt, ...byColor[color].dress];
      const top = combinedTops[Math.floor(Math.random() * combinedTops.length)];
      outfit.push(top);
      topAdded = true;

      // Pants : essayer les couleurs complémentaires définies
      if (top.type === 'shirt') {
        const allPants: ClothingItem[] = [];
        for (const pantColor of bottomColors) {
          if (byColor[pantColor]) {
            allPants.push(...byColor[pantColor].pants);
          }
        }

        if (allPants.length > 0) {
          const pant = allPants[Math.floor(Math.random() * allPants.length)];
          outfit.push(pant);
        } else {
          // Fallback 1 : essayer toutes les couleurs complémentaires
          const allComplementaryPants: ClothingItem[] = [];
          for (const color of availableComplementaryColors) {
            allComplementaryPants.push(...byColor[color].pants);
          }

          if (allComplementaryPants.length > 0) {
            const pant =
              allComplementaryPants[Math.floor(Math.random() * allComplementaryPants.length)];
            outfit.push(pant);
          } else {
            // Fallback 2 : pantalon neutre
            const neutralPantsAvailable = neutralColors.filter(
              (c) => byColor[c] && byColor[c].pants.length > 0
            );
            if (neutralPantsAvailable.length > 0) {
              const neutralColor =
                neutralPantsAvailable[Math.floor(Math.random() * neutralPantsAvailable.length)];
              const pant =
                byColor[neutralColor].pants[
                  Math.floor(Math.random() * byColor[neutralColor].pants.length)
                ];
              outfit.push(pant);
            }
          }
        }
      }
      break;
    }
  }

  // Si pas de top trouvé, essayer toutes les couleurs complémentaires
  if (!topAdded) {
    for (const color of availableComplementaryColors) {
      const combinedTops = [...byColor[color].shirt, ...byColor[color].dress];
      if (combinedTops.length > 0) {
        const top = combinedTops[Math.floor(Math.random() * combinedTops.length)];
        outfit.push(top);
        topAdded = true;

        // Pantalon : prendre d'une autre couleur complémentaire
        if
