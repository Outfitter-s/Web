import z from 'zod';
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { PublicationDAO } from '$lib/server/db/publication';
import { feedTypes, type Publication, UUID } from '$lib/types';

const schema = z.object({
  limit: z.number().min(1).max(100).optional().default(20),
  type: z.enum(feedTypes).optional().default(feedTypes[0]),
  // Accept either a JSON string or an actual array and coerce to an array of UUIDs
  seenPostIds: z.preprocess((val) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }
    return val ?? [];
  }, z.array(UUID).default([])),
});

export const GET: RequestHandler = async ({ url, locals }) => {
  const user = locals.user!;
  try {
    const queryParams = {
      limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
      offset: url.searchParams.get('offset') ? Number(url.searchParams.get('offset')) : undefined,
      type: url.searchParams.get('type') ?? undefined,
    };
    const parsed = schema.safeParse(queryParams);
    if (!parsed.success) throw new Error(parsed.error.issues[0].message);

    const { limit, type, seenPostIds } = parsed.data;
    let feed: Publication[];
    if (type === 'followed') {
      feed = await PublicationDAO.getFollowedFeed(user.id, limit, seenPostIds);
    } else {
      feed = await PublicationDAO.getForYouFeed(user.id, limit, seenPostIds);
    }
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
