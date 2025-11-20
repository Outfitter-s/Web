import { ClothingItemDAO } from '$lib/server/db/clotingItem';
import type { ClothingItemColor, ClothingItemType } from '$lib/types';
import { fail, redirect, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

// TODO: Re-write the whole back-end because whoever did this is an absolute maniac (looking at you, paqui and ChatGPT)
export const load = (async () => {
  throw error(404, 'Not Found');
}) satisfies PageServerLoad;

export const actions: Actions = {
  update_item: async ({ request, locals, params }) => {
    // Utiliser locals.user au lieu de locals.auth()
    if (!locals.user?.id) {
      throw redirect(302, '/auth/login');
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const type = formData.get('type') as ClothingItemType;
    const color = formData.get('color') as ClothingItemColor;
    const imageFile = formData.get('image') as File;

    const missingFields: string[] = [];
    if (!name) missingFields.push('name');
    if (!description) missingFields.push('description');
    if (!type) missingFields.push('type');
    if (!color) missingFields.push('color');

    if (missingFields.length > 0) {
      return fail(400, {
        error: true,
        message: missingFields.join(', '),
        action: 'update_item',
      });
    }

    try {
      const itemIdRaw = params.itemId;
      if (!itemIdRaw) {
        return fail(400, {
          error: true,
          message: 'Item ID is required',
          action: 'update_item',
        });
      }
      const itemId = itemIdRaw as `${string}-${string}-${string}-${string}-${string}`;

      // Si une nouvelle image est fournie
      if (imageFile && imageFile.size > 0) {
        const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

        // Supprimer l'ancien item et créer un nouveau avec la nouvelle image
        await ClothingItemDAO.deleteClothingItem(itemId);
        await ClothingItemDAO.uploadClothingItem(
          locals.user.id,
          imageBuffer,
          name,
          description,
          type,
          color
        );
      } else {
        // Mise à jour sans image via une requête SQL directe
        const pool = (await import('$lib/server/db')).default;
        await pool.query(
          'UPDATE clothing_item SET name = $1, description = $2, type = $3, color = $4 WHERE id = $5',
          [name, description, type, color, itemId]
        );
      }

      return {
        error: false,
        message: 'Item updated successfully',
        action: 'update_item',
      };
    } catch (error) {
      console.error('Error updating item:', error);
      return fail(500, {
        error: true,
        message: 'Failed to update item',
        action: 'update_item',
      });
    }
  },
};
