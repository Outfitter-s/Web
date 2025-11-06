import type { RequestHandler } from './$types';
import { logger } from '$lib/utils/logger';
import { ClothingItemDAO } from '$lib/server/db/clotingItem';
import { clothingItemColors, clothingItemTypes } from '$lib/types';
import z from 'zod';
import { json } from '@sveltejs/kit';

const schema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(clothingItemTypes),
  color: z.enum(clothingItemColors),
  image: z.instanceof(File).refine((file) => file.size > 0, { message: 'Image file is required' }),
});

export const POST: RequestHandler = async ({ locals, request }) => {
  try {
    const user = locals.user!;
    const formData = Object.fromEntries(await request.formData());
    const form = schema.safeParse(formData);
    if (!form.success) throw new Error(form.error.issues.map((i) => i.path[0]).join(', '));

    const { name, description, type, color, image } = form.data;

    const imageBuffer = Buffer.from(await image.arrayBuffer());

    const item = await ClothingItemDAO.uploadClothingItem(
      user.id,
      imageBuffer,
      name,
      description || null,
      type,
      color
    );
    return json({ success: true, item });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('Error creating clothing item :', msg);
    return json(
      {
        message: msg || 'errors.server.connectionRefused',
      },
      { status: 400 }
    );
  }

  return json({ success: true });
};
