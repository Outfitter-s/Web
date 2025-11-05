import type { ClothingItem, ClothingItemColor } from '$lib/types';
import { COLOR_WHEEL, NEUTRAL_COLORS, emptyByType } from './types';
import { groupByColor, hasTop, selectRandomAccessories, randIntInclusive } from './utils';

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

export function getAnalogueOutfit(items: ClothingItem[]): ClothingItem[] {
  const byColor = groupByColor(items, emptyByType);
  const colors = Object.keys(byColor) as ClothingItemColor[];
  if (colors.length === 0) return [];

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
        const neutralPantsAvailable = NEUTRAL_COLORS.filter(
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
    const neutralShoesAvailable = NEUTRAL_COLORS.filter(
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
  for (const neutralColor of NEUTRAL_COLORS) {
    if (byColor[neutralColor]) {
      allAccessories.push(...byColor[neutralColor].accessory);
    }
  }

  // Utiliser la fonction helper pour sélectionner les accessoires
  outfit.push(...selectRandomAccessories(allAccessories));

  return outfit;
}
