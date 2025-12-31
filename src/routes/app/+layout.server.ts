import { ClothingItemDAO } from '$lib/server/db/clothingItem';
import type { LayoutServerLoad } from './$types';
import { OutfitDAO } from '$lib/server/db/outfit';
import { PublicationDAO } from '$lib/server/db/publication';
import { WrappedDAO } from '$lib/server/db/wrapped';

export const load = (async ({ locals }) => {
  if (!locals?.user) {
    throw new Error('errors.auth.userIsRequired');
  }
  const user = locals.user!;
  const items = await ClothingItemDAO.getClothingItemsByUserId(user.id);
  const outfits = await OutfitDAO.getAllUserOutfits(user.id);
  const hasUserPostedToday = await PublicationDAO.hasUserPostedToday(user.id);
  const wrappedAvailable = await WrappedDAO.meetsPrerequisite();

  return { user, items, outfits, hasUserPostedToday, wrappedAvailable };
}) satisfies LayoutServerLoad;
