import type { ClothingItem, UUID, ClothingItemType } from '$lib/types';
import { ClothingItemDAO } from './clotingItem';
import { getWeather } from '$lib/utils/weather';

export async function generateOutfit(userId: UUID): Promise<ClothingItem[]> {
    const items = await ClothingItemDAO.getClothingItemsByUserId(userId);
    const outfit: ClothingItem[] = [];

    const weather = await getWeather();

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

async function scoring(userId: UUID): Promise<ClothingItem[]> {
    const items = await ClothingItemDAO.getClothingItemsByUserId(userId);

    const weather = await getWeather();

    // Si météo indisponible, renvoyer les items sans scoring
    if ('error' in weather) return items;

    const temp = Number.parseFloat(weather.temp || '0');
    const rain = Number.parseFloat(weather.rain || '0');

    // TODO : Continuer scoring
    // Multiplicateurs utilisateur (tous à 1 par défaut)
    const multipliers = { temp: 1, rain: 1, color: 1 };
    const weights = { temp: 0.7, rain: 0.2, color: 0.1 }; // simple pondération

    ////////////////////////////////////////////////////////////////////////////////////////////////////////

    //TODO : Scoring pour la température en fonction du type ET du titre/desc

    const isWaterproof = (item: ClothingItem) => {
        const t = (item.type || '').toString().toLowerCase();
        if (t.includes('coat') || t.includes('rain')) return true;

        const d = (item.description || '').toString().toLowerCase();
        return d.includes('waterproof') || d.includes('impermeable') || d.includes('water repellent');
    };

    const colorScore = (_: ClothingItem) => 0.5; // placeholder neutre

    // clamp01 : force une valeur entre 0 et 1 pour éviter les débordements
    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
    const scored = items.map((item) => {

        const rainScore = rain > 1 ? (isWaterproof(item) ? 1 : 0.2) : isWaterproof(item) ? 0.4 : 0.6;

        const colScore = colorScore(item);

        //const wTemp = tempScore * weights.temp * multipliers.temp;
        const wRain = rainScore * weights.rain * multipliers.rain;
        const wColor = colScore * weights.color * multipliers.color;

        const norm = weights.temp * multipliers.temp + weights.rain * multipliers.rain + weights.color * multipliers.color;
        const score = norm > 0 ? clamp01((wRain + wColor) / norm) : 0;

        return { item, score };
    });

    // Trier par score décroissant les items
    // Ne fait pas de tenue à proprement parler, juste un classement pour en créer
    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.item);
}