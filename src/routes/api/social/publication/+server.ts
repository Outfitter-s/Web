import { PublicationDAO } from '$lib/server/db/publication';
import { ImageProcessor } from '$lib/server/imageProcessing';
import { UUID } from '$lib/types';
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
  image: z
    .instanceof(File)
    .refine((file) => file.size > 0, { message: 'Missing image when making a post' }),
});

export const POST: RequestHandler = async ({ locals, request }) => {
  try {
    const user = locals.user!;
    const formData = Object.fromEntries(await request.formData());
    const form = schema.safeParse(formData);
    if (!form.success) throw new Error(form.error.issues[0].message);

    const { description, image, todaysOutfit } = form.data;

    const imageBuffer = await ImageProcessor.resizeImage(await image.arrayBuffer(), {
      width: 1024,
    });

    const item = await PublicationDAO.create(
      user.id,
      imageBuffer,
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
      image: schema.shape.image.optional(),
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

    const { description, id, image } = form.data;
    const post = await PublicationDAO.getPublicationById(id);
    if (!post || post.user.id !== user.id) {
      throw new Error('errors.social.post.notFound');
    }
    let imageBuffer: Buffer | undefined = undefined;
    if (image) {
      imageBuffer = await ImageProcessor.resizeImage(await image.arrayBuffer());
    }
    await PublicationDAO.updatePublication(id, { description, imageBuffer });

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
