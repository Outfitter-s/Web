import type { ClothingItem, ClothingItemColor } from '$lib/types';
import { COLOR_WHEEL, NEUTRAL_COLORS, emptyByType } from './types';
import { groupByColor, hasTop, hasPants, selectRandomAccessories } from './utils';

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

export function getComplementaryOutfit(items: ClothingItem[]): ClothingItem[] {
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
    // Les deux stratégies sont possibles, choisir aléatoirement
    useInvertedStrategy = Math.random() > 0.5;
  } else if (complementaryHasTop && baseHasPants && !baseHasTop) {
    useInvertedStrategy = true;
  } else if (baseHasTop && complementaryHasPants) {
    useInvertedStrategy = false;
  } else {
    // Aucune des deux n'est idéale, on fait de notre mieux
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
        if (top.type === 'shirt') {
          const otherColors = availableComplementaryColors.filter((c) => c !== color);
          const allPants: ClothingItem[] = [];
          for (const otherColor of otherColors) {
            allPants.push(...byColor[otherColor].pants);
          }

          if (allPants.length > 0) {
            const pant = allPants[Math.floor(Math.random() * allPants.length)];
            outfit.push(pant);
          } else if (byColor[color].pants.length > 0) {
            // Même couleur en dernier recours
            const pant =
              byColor[color].pants[Math.floor(Math.random() * byColor[color].pants.length)];
            outfit.push(pant);
          }
        }
        break;
      }
    }
  }

  // Shoes : peut être de n'importe quelle couleur du schéma complémentaire
  const allShoes: ClothingItem[] = [];
  for (const color of availableComplementaryColors) {
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

  // Accessories : utiliser la fonction helper
  const allAccessories: ClothingItem[] = [];
  for (const color of availableComplementaryColors) {
    allAccessories.push(...byColor[color].accessory);
  }
  // Ajouter les accessoires neutres (ils équilibrent le contraste)
  for (const neutralColor of NEUTRAL_COLORS) {
    if (byColor[neutralColor]) {
      allAccessories.push(...byColor[neutralColor].accessory);
    }
  }

  outfit.push(...selectRandomAccessories(allAccessories));

  return outfit;
}
