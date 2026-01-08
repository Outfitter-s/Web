import type { RequestHandler } from './$types';
import { logger } from '$lib/utils/logger';
import { ClothingItemDAO } from '$lib/server/db/clothingItem';
import { clothingItemColors, clothingItemTypes, clothingItemMotifs } from '$lib/types';
import z from 'zod';
import { json } from '@sveltejs/kit';
import { ImageProcessor } from '$lib/server/imageProcessing';

const schema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(clothingItemTypes),
  color: z.enum(clothingItemColors),
  motif: z.enum(clothingItemMotifs).optional(),
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

    const { name, description, type, color, motif, image } = form.data;

    const imageBuffer = await ImageProcessor.resizeImage(await image.arrayBuffer());

    const item = await ClothingItemDAO.uploadClothingItem(
      user.id,
      imageBuffer,
      name,
      description || null,
      type,
      color,
      motif ?? null
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
      motif: z.enum(clothingItemMotifs).optional(),
    });
    const form = newSchema.safeParse(formData);
    if (!form.success)
      throw new Error(
        form.error.issues
          .map((i) => i.path)
          .flat()
          .join(',')
      );

    const { name, description, type, color, image, id, motif } = form.data;
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
      motif: motif ?? null,
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
