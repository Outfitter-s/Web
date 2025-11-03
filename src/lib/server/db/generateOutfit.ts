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