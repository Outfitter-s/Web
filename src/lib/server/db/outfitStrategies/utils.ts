import {
  type ClothingItemColor,
  type ScoredClothingItem,
  type ClothingItemType,
  TEMP_IDEALS,
  type ByType,
  COLOR_WHEEL,
  NEUTRAL_COLORS,
} from '$lib/types';

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
  items: ScoredClothingItem[],
  emptyByType: () => ByType
): Record<string, ByType> {
  const byColor: Record<string, ByType> = {};
  for (const item of items) {
    (byColor[item.color] ??= emptyByType())[item.type].push(item);
  }
  return byColor;
}

export function selectRandomAccessories(
  availableAccessories: ScoredClothingItem[],
  maxCount: number = 3
): ScoredClothingItem[] {
  const accessories: ScoredClothingItem[] = [];
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

export function isWaterproof(item: ScoredClothingItem) {
  const t = (item.type || '').toString().toLowerCase();
  if (t.includes('coat') || t.includes('rain')) return true;

  const d = (item.description || '').toString().toLowerCase();
  return d.includes('waterproof') || d.includes('impermeable') || d.includes('water repellent');
}

export function getTempIdeal(type?: string): { ideal: number; tol: number } {
  const t = (type ?? '').toString().toLowerCase().trim();

  if (t in TEMP_IDEALS) {
    return TEMP_IDEALS[t as ClothingItemType | 'default'];
  }
  return TEMP_IDEALS.default;
}

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// Colors ---------------------------------------------------------------------------------------------------

export function getComplementaryColor(color: ClothingItemColor): ClothingItemColor {
  // Si c'est une couleur neutre, retourner une couleur chromatique aléatoire
  if (NEUTRAL_COLORS.includes(color)) {
    const chromaticColors = COLOR_WHEEL.filter((c) => !NEUTRAL_COLORS.includes(c));
    return chromaticColors[Math.floor(Math.random() * chromaticColors.length)];
  }

  const index = COLOR_WHEEL.indexOf(color);
  if (index === -1) return color;

  // Calculer l'index de la couleur complémentaire
  // Sur une roue de 7 couleurs chromatiques, l'opposé est à +3 ou +4 positions
  const chromaticColors = COLOR_WHEEL.filter((c) => !NEUTRAL_COLORS.includes(c));
  const chromaticIndex = chromaticColors.indexOf(color);

  if (chromaticIndex === -1) return color;

  // Position opposée : ajouter la moitié du nombre de couleurs (arrondi)
  const complementaryIndex =
    (chromaticIndex + Math.floor(chromaticColors.length / 2)) % chromaticColors.length;

  return chromaticColors[complementaryIndex];
}

export function getComplementaryColors(color: ClothingItemColor): ClothingItemColor[] {
  if (NEUTRAL_COLORS.includes(color)) {
    const chromaticColors = COLOR_WHEEL.filter((c) => !NEUTRAL_COLORS.includes(c));
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
  if (!NEUTRAL_COLORS.includes(prevColor)) {
    colors.push(prevColor);
  }

  // Couleur après la complémentaire
  const nextIndex = (complementaryIndex + 1) % COLOR_WHEEL.length;
  const nextColor = COLOR_WHEEL[nextIndex];
  if (!NEUTRAL_COLORS.includes(nextColor)) {
    colors.push(nextColor);
  }

  return colors;
}

export function getAnalogousColors(
  color: ClothingItemColor,
  distance: number = 1
): ClothingItemColor[] {
  const index = COLOR_WHEEL.indexOf(color);
  if (index === -1) return [color];

  if (NEUTRAL_COLORS.includes(color)) {
    const chromaticColors = COLOR_WHEEL.filter((c) => !NEUTRAL_COLORS.includes(c));
    return [color, ...chromaticColors];
  }

  const analogousColors: ClothingItemColor[] = [color];

  for (let i = 1; i <= distance; i++) {
    const prevIndex = (index - i + COLOR_WHEEL.length) % COLOR_WHEEL.length;
    const prevColor = COLOR_WHEEL[prevIndex];
    if (!NEUTRAL_COLORS.includes(prevColor)) analogousColors.push(prevColor);

    const nextIndex = (index + i) % COLOR_WHEEL.length;
    const nextColor = COLOR_WHEEL[nextIndex];
    if (!NEUTRAL_COLORS.includes(nextColor)) analogousColors.push(nextColor);
  }

  return analogousColors;
}

export function getTriadicColors(color: ClothingItemColor): ClothingItemColor[] {
  // Groupes triadiques basés sur l'harmonie visuelle
  const triadicGroups: Record<ClothingItemColor, ClothingItemColor[]> = {
    // Groupe 1 : Primaires classiques
    red: ['blue', 'yellow', 'white', 'black', 'gray', 'brown'],
    blue: ['yellow', 'red', 'white', 'black', 'gray', 'brown'],
    yellow: ['red', 'blue', 'white', 'black', 'gray', 'brown'],

    // Groupe 2 : Secondaires
    orange: ['green', 'purple', 'white', 'black', 'gray', 'brown'],
    green: ['purple', 'orange', 'white', 'black', 'gray', 'brown'],
    purple: ['orange', 'green', 'white', 'black', 'gray', 'brown'],

    // Groupe 3 : Pink avec primaires froides
    pink: ['blue', 'green', 'white', 'black', 'gray', 'brown'],

    // Neutres : vont avec tout
    white: ['red', 'blue', 'yellow', 'green', 'orange', 'purple', 'pink', 'black', 'gray', 'brown'],
    black: ['red', 'blue', 'yellow', 'green', 'orange', 'purple', 'pink', 'white', 'gray', 'brown'],
    gray: ['red', 'blue', 'yellow', 'green', 'orange', 'purple', 'pink', 'white', 'black', 'brown'],
    brown: ['red', 'blue', 'yellow', 'green', 'orange', 'purple', 'pink', 'white', 'black', 'gray'],
  };

  return triadicGroups[color] || [color];
}
