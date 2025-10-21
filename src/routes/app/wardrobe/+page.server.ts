import { ClothingItemDAO } from '$lib/server/db/clotingItem';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals }) => {
  const user = locals.user!;
  const items = await ClothingItemDAO.getClothingItemsByUserId(user.id);
  return { items };
}) satisfies PageServerLoad;
