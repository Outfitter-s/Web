import z from 'zod';
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { PublicationDAO } from '$lib/server/db/publication';
import { UUID } from '$lib/types';

const schema = z.object({
  limit: z.number().min(1).max(100).optional().default(20),
  userId: UUID,
  offset: z.number().min(0).optional().default(0),
});

export const GET: RequestHandler = async ({ url }) => {
  try {
    const queryParams = {
      limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
      offset: url.searchParams.get('offset') ? Number(url.searchParams.get('offset')) : undefined,
      userId: url.searchParams.get('userId') ?? undefined,
    };
    const parsed = schema.safeParse(queryParams);
    console.log(parsed);
    if (!parsed.success) throw new Error(parsed.error.issues[0].message);

    const { userId, limit, offset } = parsed.data;
    const feed = await PublicationDAO.getPublicationByUserId(userId, limit, offset);
    return json({ success: true, feed });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json(
      {
        message: msg || 'errors.server.connectionRefused',
      },
      { status: 400 }
    );
  }
};
