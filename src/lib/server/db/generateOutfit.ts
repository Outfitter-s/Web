import type { ClothingItem, UUID } from '$lib/types';
import { ClothingItemDAO } from './clotingItem';

export async function generateOutfit(userId: UUID): Promise<ClothingItem[]> {
    const items = await ClothingItemDAO.getClothingItemsByUserId(userId);

    //Ajout de la logique de génération de tenue ici

    return items;
}