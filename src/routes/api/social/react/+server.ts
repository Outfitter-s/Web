import z from 'zod';
import type { RequestHandler } from './$types';
import { reactions, UUID } from '$lib/types';
import { ReactionDAO } from '$lib/server/db/reaction';
import { logger } from '$lib/utils';
import { json } from '@sveltejs/kit';

const schema = z.object({
  postId: UUID,
  reaction: z.enum(reactions),
});

export const POST: RequestHandler = async ({ locals, request }) => {
  try {
    const user = locals.user!;
    const body = await request.json();
    const data = schema.safeParse(body);
    if (!data.success) throw new Error(data.error.issues.map((i) => i.message).join(', '));
    const { postId, reaction } = data.data;

    const newReaction = await ReactionDAO.reactToPost(postId, user.id, reaction);
    const newReactionCounts = await ReactionDAO.getReactionsForPost(postId);

    return json({ success: true, newReaction, newReactionCounts });
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
