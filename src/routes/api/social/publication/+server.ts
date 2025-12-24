import { PublicationDAO } from '$lib/server/db/publication';
import { ImageProcessor } from '$lib/server/imageProcessing';
import { PublicationImagesLengths, UUID } from '$lib/types';
import { logger } from '$lib/utils/logger';
import { json, type RequestHandler } from '@sveltejs/kit';
import z from 'zod';

const schema = z.object({
  description: z.string().max(100),
  todaysOutfit: z
    .string()
    .refine((val) => val === 'on' || val === undefined)
    .transform((val) => val === 'on')
    .default(false),
  images: z
    .array(
      z
        .instanceof(File)
        .refine((file) => file.size > 0, { message: 'Missing image when making a post' })
    )
    .min(PublicationImagesLengths.min)
    .max(PublicationImagesLengths.max),
});

export const POST: RequestHandler = async ({ locals, request }) => {
  try {
    const user = locals.user!;
    // Read the multipart form data directly so we can preserve multiple files
    const fd = await request.formData();
    const formImages = fd.getAll('images[]') as File[];
    const descriptionVal = String(fd.get('description') ?? '');
    // keep compatibility with checkbox value 'on'
    const todaysOutfitRaw = fd.get('todaysOutfit');
    const todaysOutfitVal = todaysOutfitRaw === 'on' ? 'on' : undefined;

    const form = schema.safeParse({
      description: descriptionVal,
      images: formImages,
      todaysOutfit: todaysOutfitVal,
    });
    if (!form.success) throw new Error(form.error.issues[0].message);
    const { description, todaysOutfit, images } = form.data;
    const processedImages: Buffer[] = [];
    for (const image of images) {
      const imageBuffer = await ImageProcessor.resizeImage(await image.arrayBuffer(), {
        width: 1024,
      });
      processedImages.push(imageBuffer);
    }

    const item = await PublicationDAO.create(
      user.id,
      processedImages,
      description,
      todaysOutfit ?? false
    );

    return json({ success: true, item });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('Error creating a post :', msg);
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
    const patchSchema = z.object({
      description: schema.shape.description,
      id: UUID,
    });
    const form = patchSchema.safeParse(formData);
    if (!form.success)
      throw new Error(
        form.error.issues
          .map((i) => i.path)
          .flat()
          .join(',')
      );

    const { description, id } = form.data;
    const post = await PublicationDAO.getPublicationById(id);
    if (!post || post.user.id !== user.id) {
      throw new Error('errors.social.post.notFound');
    }
    await PublicationDAO.updatePublication(id, { description });

    return json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('Error editing post :', msg);
    return json(
      {
        message: msg || 'errors.server.connectionRefused',
      },
      { status: 400 }
    );
  }
};
