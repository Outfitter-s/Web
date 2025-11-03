import type { ClothingItem, UUID } from '$lib/types';
import { ClothingItemDAO } from './clotingItem';
import { getWeather } from '$lib/utils/weather';
import { clothingItemColors, clothingItemTypes } from '$lib/types';

export async function generateOutfit(userId: UUID): Promise<ClothingItem[]> {
  const items = await ClothingItemDAO.getClothingItemsByUserId(userId);

  const weather = await getWeather();

  //Ajout de la logique de génération de tenue ici

  return items;
}

function getMonochromeOutfit(items: ClothingItem[]): ClothingItem[] {
  // Exemple de logique pour générer une tenue monochrome
  const outfit: ClothingItem[] = [];
  const colorMap: Record<string, ClothingItem[]> = {};

  // Regrouper les articles par couleur
  for (const item of items) {
    if (!colorMap[item.color]) {
      colorMap[item.color] = [];
    }
    colorMap[item.color].push(item);
  }

  // Sélectionner une couleur aléatoire et choisir des articles de cette couleur
  const colors = Object.keys(colorMap);
  if (colors.length > 0) {
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    outfit.push(...colorMap[randomColor]);
  }

  return outfit;
}
