import type { ClothingItem, UUID, ClothingItemType } from '$lib/types';
import { ClothingItemDAO } from './clotingItem';

export async function generateOutfit(userId: UUID): Promise<ClothingItem[]> {
  const items = await ClothingItemDAO.getClothingItemsByUserId(userId);
  const outfit: ClothingItem[] = [];

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

  for (const item of items) {
    grouped[item.type].push(item);
  }

  // Dress and shirts
  const combinedTops = [...grouped.shirt, ...grouped.dress];

  let top: ClothingItem | null = null;
  if (combinedTops.length > 0) {
    const randomIndex = Math.floor(Math.random() * combinedTops.length);
    top = combinedTops[randomIndex];
    outfit.push(top);
  }

  // Pants
  if (top?.type === 'shirt') {
    if (grouped.pants.length > 0) {
      const randomIndex = Math.floor(Math.random() * grouped.pants.length);
      let pant = grouped.pants[randomIndex];
      outfit.push(pant);
    }
  }

  // A implémenter : Check la température dehors pour savoir si on prend un sweater ou un jacket

  // Shoes
  if (grouped.shoes.length > 0) {
    const randomIndex = Math.floor(Math.random() * grouped.shoes.length);
    let shoes = grouped.shoes[randomIndex];
    outfit.push(shoes);
  }

  // Accessories
  if (grouped.accessory.length > 0) {
    const accessoryMaxNum = Math.min(grouped.accessory.length, 3);
    const accessoryNum = randIntInclusive(0, accessoryMaxNum);
    console.log(accessoryNum);

    for (let i = 0; i < accessoryNum; i++) {
      const randomIndex = Math.floor(Math.random() * grouped.accessory.length);
      let accessory = grouped.accessory[randomIndex];
      outfit.push(accessory);
    }
  }

  return outfit;
}

// renvoie un entier aléatoire entre min et max (les deux inclus)
function randIntInclusive(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  if (max < min) return min;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
