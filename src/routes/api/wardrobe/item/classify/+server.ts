import type { RequestHandler } from './$types';
import { logger } from '$lib/utils/logger';
import z from 'zod';
import { json } from '@sveltejs/kit';
import { ImageProcessor } from '$lib/server/imageProcessing';

const schema = z.object({
  image: z
    .instanceof(File)
    .refine((file) => file.size > 0, { message: 'errors.clothing.item.missingImage' }),
});

export const POST: RequestHandler = async ({ request }) => {
  try {
    const formData = Object.fromEntries(await request.formData());
    const form = schema.safeParse(formData);
    if (!form.success) throw new Error(form.error.issues[0].message);

    const { image } = form.data;
    const imageBuffer = await ImageProcessor.resizeImage(await image.arrayBuffer());
    const cleanedUpImage = await ImageProcessor.removeBackground(imageBuffer);
    const { type: detectedType, color: detectedColor } =
      await ImageProcessor.processImage(cleanedUpImage);

    return json({
      success: true,
      type: detectedType,
      color: detectedColor,
      buffer: cleanedUpImage,
      mime: 'image/png',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('Error classifying item :', msg);
    return json(
      {
        message: msg || 'errors.server.connectionRefused',
      },
      { status: 400 }
    );
  }
};
