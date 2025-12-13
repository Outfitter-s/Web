import { ClothingItemDAO } from '$lib/server/db/clotingItem';
import { OutfitDAO } from '$lib/server/db/outfit';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals }) => {
  const user = locals.user!;
  const items = await ClothingItemDAO.getClothingItemsByUserId(user.id);
  const outfits = await OutfitDAO.getAllUserOutfits(user.id);
  return { items, outfits };
}) satisfies PageServerLoad;
