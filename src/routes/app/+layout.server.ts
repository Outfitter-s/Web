import { ClothingItemDAO } from '$lib/server/db/clotingItem';
import type { Outfit } from '$lib/types';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ locals }) => {
  if (!locals?.user) {
    throw new Error('errors.auth.userIsRequired');
  }
  const user = locals.user!;
  const items = await ClothingItemDAO.getClothingItemsByUserId(user.id);
  const outfits: Outfit[] = [];

  return { user, items, outfits };
}) satisfies LayoutServerLoad;
