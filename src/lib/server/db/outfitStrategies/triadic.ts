import type { ClothingItem, ClothingItemColor } from '$lib/types';
import { COLOR_WHEEL, NEUTRAL_COLORS, emptyByType } from './types';
import { groupByColor, hasTop, randIntInclusive } from './utils';

export function getTriadicColors(color: ClothingItemColor): ClothingItemColor[] {
  // Groupes triadiques basés sur l'harmonie visuelle
  const triadicGroups: Record<ClothingItemColor, ClothingItemColor[]> = {
    // Groupe 1 : Primaires classiques
    red: ['red', 'blue', 'yellow'],
    blue: ['blue', 'yellow', 'red'],
    yellow: ['yellow', 'red', 'blue'],

    // Groupe 2 : Secondaires
    orange: ['orange', 'green', 'purple'],
    green: ['green', 'purple', 'orange'],
    purple: ['purple', 'orange', 'green'],

    // Groupe 3 : Pink avec primaires froides
    pink: ['pink', 'blue', 'green'],

    // Neutres : vont avec tout
    white: ['red', 'blue', 'yellow', 'green', 'orange', 'purple', 'pink'],
    black: ['red', 'blue', 'yellow', 'green', 'orange', 'purple', 'pink'],
    gray: ['red', 'blue', 'yellow', 'green', 'orange', 'purple', 'pink'],
    brown: ['red', 'blue', 'yellow', 'green', 'orange', 'purple', 'pink'],
  };

  return triadicGroups[color] || [color];
}

export function getTriadicOutfit(items: ClothingItem[]): ClothingItem[] {
  const byColor = groupByColor(items, emptyByType);
  const colors = Object.keys(byColor) as ClothingItemColor[];
  if (colors.length === 0) return [];

  // Trier les couleurs selon COLOR_WHEEL
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

  // Obtenir les couleurs triadiques
  const triadicColors = getTriadicColors(baseColor);

  // Filtrer pour ne garder que les couleurs disponibles
  const availableTriadicColors = triadicColors.filter((c) => colors.includes(c));

  const outfit: ClothingItem[] = [];

  // Stratégie : répartir les 3 couleurs sur les 3 pièces principales
  // Top = couleur 1, Pantalon = couleur 2, Shoes = couleur 3 (ou variations)

  // Définir quelle couleur pour quelle pièce (rotation aléatoire des 3 couleurs)
  const shuffledColors = [...availableTriadicColors].sort(() => Math.random() - 0.5);

  const topColor = shuffledColors[0] || baseColor;
  const bottomColor = shuffledColors[1] || shuffledColors[0] || baseColor;
  const shoesColor = shuffledColors[2] || shuffledColors[1] || shuffledColors[0] || baseColor;

  // Top : utiliser la première couleur triadique
  let topAdded = false;
  if (
    byColor[topColor] &&
    (byColor[topColor].shirt.length > 0 || byColor[topColor].dress.length > 0)
  ) {
    const combinedTops = [...byColor[topColor].shirt, ...byColor[topColor].dress];
    const top = combinedTops[Math.floor(Math.random() * combinedTops.length)];
    outfit.push(top);
    topAdded = true;

    // Pants : utiliser la deuxième couleur triadique
    if (top.type === 'shirt') {
      if (byColor[bottomColor] && byColor[bottomColor].pants.length > 0) {
        const pant =
          byColor[bottomColor].pants[Math.floor(Math.random() * byColor[bottomColor].pants.length)];
        outfit.push(pant);
      } else {
        // Fallback 1 : essayer n'importe quelle couleur triadique
        const allTriadicPants: ClothingItem[] = [];
        for (const color of availableTriadicColors) {
          allTriadicPants.push(...byColor[color].pants);
        }

        if (allTriadicPants.length > 0) {
          const pant = allTriadicPants[Math.floor(Math.random() * allTriadicPants.length)];
          outfit.push(pant);
        } else {
          // Fallback 2 : pantalon neutre
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
  }

  // Si pas de top avec la couleur prévue, essayer les autres couleurs triadiques
  if (!topAdded) {
    for (const color of availableTriadicColors) {
      const combinedTops = [...byColor[color].shirt, ...byColor[color].dress];
      if (combinedTops.length > 0) {
        const top = combinedTops[Math.floor(Math.random() * combinedTops.length)];
        outfit.push(top);
        topAdded = true;

        // Pantalon : prendre une autre couleur triadique
        if (top.type === 'shirt') {
          const otherColors = availableTriadicColors.filter((c) => c !== color);
          const allPants: ClothingItem[] = [];
          for (const otherColor of otherColors) {
            allPants.push(...byColor[otherColor].pants);
          }

          if (allPants.length > 0) {
            const pant = allPants[Math.floor(Math.random() * allPants.length)];
            outfit.push(pant);
          }
        }
        break;
      }
    }
  }

  // Shoes : utiliser la troisième couleur triadique
  if (byColor[shoesColor] && byColor[shoesColor].shoes.length > 0) {
    const shoes =
      byColor[shoesColor].shoes[Math.floor(Math.random() * byColor[shoesColor].shoes.length)];
    outfit.push(shoes);
  } else {
    // Fallback : n'importe quelle couleur triadique
    const allTriadicShoes: ClothingItem[] = [];
    for (const color of availableTriadicColors) {
      allTriadicShoes.push(...byColor[color].shoes);
    }

    if (allTriadicShoes.length > 0) {
      const shoes = allTriadicShoes[Math.floor(Math.random() * allTriadicShoes.length)];
      outfit.push(shoes);
    } else {
      // Fallback neutre
      const neutralShoesAvailable = NEUTRAL_COLORS.filter(
        (c) => byColor[c] && byColor[c].shoes.length > 0
      );
      if (neutralShoesAvailable.length > 0) {
        const neutralColor =
          neutralShoesAvailable[Math.floor(Math.random() * neutralShoesAvailable.length)];
        const shoes =
          byColor[neutralColor].shoes[
            Math.floor(Math.random() * byColor[neutralColor].shoes.length)
          ];
        outfit.push(shoes);
      }
    }
  }

  // Accessories : mélange des 3 couleurs triadiques + neutres
  const allAccessories: ClothingItem[] = [];
  for (const color of availableTriadicColors) {
    allAccessories.push(...byColor[color].accessory);
  }
  // Ajouter les accessoires neutres (pour équilibrer)
  for (const neutralColor of NEUTRAL_COLORS) {
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
