import { fail, redirect } from '@sveltejs/kit';
import { ClothingItemDAO } from '$lib/server/db/clothingItem';
import type { Actions } from './$types';

export const actions: Actions = {
  delete: async ({ locals, params }) => {
    const { itemId } = params;
    const user = locals.user!;
    try {
      const owner = await ClothingItemDAO.getOwner(itemId);
      if (!owner || owner !== user.id) {
        return fail(404, { message: 'errors.clothing.item.notFound', action: 'delete' });
      }
      await ClothingItemDAO.deleteClothingItem(itemId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return fail(500, { message: msg, action: 'delete' });
    }
    return redirect(303, '/app/wardrobe');
  },
};
