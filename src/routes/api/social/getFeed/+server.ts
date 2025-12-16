import z from 'zod';
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { PublicationDAO } from '$lib/server/db/publication';

const schema = z.object({
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
});

export const GET: RequestHandler = async ({ url, locals }) => {
  const user = locals.user!;
  try {
    const queryParams = {
      limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
      offset: url.searchParams.get('offset') ? Number(url.searchParams.get('offset')) : undefined,
    };
    const parsed = schema.safeParse(queryParams);
    if (!parsed.success) throw new Error(parsed.error.issues[0].message);

    const { limit, offset } = parsed.data;
    const feed = await PublicationDAO.getFeed(user.id, limit, offset);
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
