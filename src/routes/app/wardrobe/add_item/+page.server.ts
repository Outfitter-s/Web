import z from 'zod';
import type { Actions } from './$types';
import { logger } from '$lib/utils/logger';
import { fail, redirect } from '@sveltejs/kit';
import { ClothingItemDAO } from '$lib/server/db/clotingItem';
import { clothingItemTypes } from '$lib/types';

export const actions: Actions = {
  create_item: async ({ request, locals }) => {
    try {
      const user = locals.user!;
      const formData = Object.fromEntries(await request.formData());
      const schema = z.object({
        name: z.string().min(1).max(100),
        description: z.string().min(1).max(500),
        type: z.enum(clothingItemTypes),
        color: z.string().min(1).max(50),
        image: z
          .instanceof(File)
          .refine((file) => file.size > 0, { message: 'Image file is required' }),
      });
      const form = schema.safeParse(formData);
      if (!form.success) throw new Error(form.error.issues.map((i) => i.path[0]).join(', '));

      const { name, description, type, color, image } = form.data;

      const imageBuffer = Buffer.from(await image.arrayBuffer());

      await ClothingItemDAO.uploadClothingItem(
        user.id,
        imageBuffer,
        name,
        description,
        type,
        color
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error('Error creating clothing item :', msg);
      return fail(400, {
        action: 'create_item',
        error: true,
        message: msg || 'errors.server.connectionRefused',
      });
    }

    throw redirect(303, '/app/wardrobe');
  },
};
