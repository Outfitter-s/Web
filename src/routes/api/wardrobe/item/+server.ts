import type { RequestHandler } from './$types';
import { logger } from '$lib/utils/logger';
import { ClothingItemDAO } from '$lib/server/db/clothingItem';
import { clothingItemColors, clothingItemTypes, ClothingItemPatterns } from '$lib/types';
import z from 'zod';
import { json } from '@sveltejs/kit';
import { ImageProcessor } from '$lib/server/imageProcessing';

const schema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(clothingItemTypes),
  color: z.enum(clothingItemColors),
  pattern: z.enum(ClothingItemPatterns).optional(),
  image: z
    .instanceof(File)
    .refine((file) => file.size > 0, { message: 'errors.clothing.item.missingImage' }),
});

export const POST: RequestHandler = async ({ locals, request }) => {
  try {
    const user = locals.user!;
    const formData = Object.fromEntries(await request.formData());
    const form = schema.safeParse(formData);
    if (!form.success)
      throw new Error(
        form.error.issues
          .map((i) => i.path)
          .flat()
          .join(',')
      );

    const { name, description, type, color, pattern, image } = form.data;

    const imageBuffer = await ImageProcessor.resizeImage(await image.arrayBuffer());

    const item = await ClothingItemDAO.uploadClothingItem(
      user.id,
      imageBuffer,
      name,
      description || null,
      type,
      color,
      pattern ?? null
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
};

export const PATCH: RequestHandler = async ({ locals, request }) => {
  try {
    const user = locals.user!;
    const formData = Object.fromEntries(await request.formData());
    const newSchema = schema.extend({
      id: z.string().min(1),
      image: z.instanceof(File).optional(),
      pattern: z.enum(ClothingItemPatterns).optional(),
    });
    const form = newSchema.safeParse(formData);
    if (!form.success)
      throw new Error(
        form.error.issues
          .map((i) => i.path)
          .flat()
          .join(',')
      );

    const { name, description, type, color, image, id, pattern } = form.data;
    const item = await ClothingItemDAO.getClothingItemById(id);
    if (!item || item.userId !== user.id) {
      throw new Error('errors.clothing.item.notFound');
    }
    await ClothingItemDAO.updateClothingItem({
      ...item,
      name,
      description: description || '',
      type,
      color,
      pattern: pattern ?? null,
    });
    if (image) {
      const imageBuffer = await ImageProcessor.resizeImage(await image.arrayBuffer());
      await ClothingItemDAO.writeClothingItemImage(item.id, imageBuffer);
    }

    return json({ success: true });
    if (!item || item.userId !== user.id) {
      throw new Error('errors.clothing.item.notFound');
    }
    await ClothingItemDAO.updateClothingItem({
      ...item,
      name,
      description: description || '',
      type,
      color,
    });
    if (image) {
      const imageBuffer = await ImageProcessor.resizeImage(await image.arrayBuffer());
      await ClothingItemDAO.writeClothingItemImage(item.id, imageBuffer);
    }

    return json({ success: true });
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
};
