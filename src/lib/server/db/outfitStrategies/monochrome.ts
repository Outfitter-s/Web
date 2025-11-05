import type { ClothingItem } from '$lib/types';
import { COLOR_WHEEL, NEUTRAL_COLORS, emptyByType } from './types';
import { groupByColor, hasTop, selectRandomAccessories } from './utils';

export function getMonochromeOutfit(items: ClothingItem[]): ClothingItem[] {
  const byColor = groupByColor(items, emptyByType);
  const colors = Object.keys(byColor) as Array<(typeof COLOR_WHEEL)[number]>;
  if (colors.length === 0) return [];

  // Trier les couleurs selon COLOR_WHEEL
  const sortedColors = colors.sort((a, b) => {
    const indexA = COLOR_WHEEL.indexOf(a);
    const indexB = COLOR_WHEEL.indexOf(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  // Trouver la meilleure couleur
  let baseColor = sortedColors.find((c) => hasTop(byColor[c]) && byColor[c].shoes.length > 0);
  if (!baseColor) baseColor = sortedColors.find((c) => hasTop(byColor[c]));
  if (!baseColor) baseColor = sortedColors[0];

  const group = byColor[baseColor];
  const outfit: ClothingItem[] = [];

  // Top
  const combinedTops = [...group.shirt, ...group.dress];
  if (combinedTops.length > 0) {
    const top = combinedTops[Math.floor(Math.random() * combinedTops.length)];
    outfit.push(top);

    // Pants
    if (top.type === 'shirt') {
      if (group.pants.length > 0) {
        const pant = group.pants[Math.floor(Math.random() * group.pants.length)];
        outfit.push(pant);
      } else {
        // Fallback neutre
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

  // Shoes
  if (group.shoes.length > 0) {
    const shoes = group.shoes[Math.floor(Math.random() * group.shoes.length)];
    outfit.push(shoes);
  } else {
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

  // Accessories
  const availableAccessories = [
    ...group.accessory,
    ...NEUTRAL_COLORS.filter((c) => c !== baseColor).flatMap((c) => byColor[c]?.accessory || []),
  ];
  outfit.push(...selectRandomAccessories(availableAccessories));

  return outfit;
}
