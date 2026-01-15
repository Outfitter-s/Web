import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import z from 'zod';
import { UUID } from '$lib/types';
import { SocialDAO } from '$lib/server/db/social';

const schema = z.object({
  userId: UUID,
});

export const POST: RequestHandler = async ({ locals, request }) => {
  const user = locals.user!;
  try {
    const body = await request.json();
    const data = schema.safeParse(body);
    if (!data.success) throw new Error(data.error.issues.map((i) => i.message).join(', '));
    const { userId } = data.data;
    if (user.id === userId) throw new Error('errors.social.cannotFollowYourself');
    await SocialDAO.followUser(user.id, userId);
    return json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return json({ error: msg }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
  const user = locals.user!;
  try {
    const body = await request.json();
    const data = schema.safeParse(body);
    if (!data.success) throw new Error(data.error.issues.map((i) => i.message).join(', '));
    const { userId } = data.data;
    if (user.id === userId) throw new Error('errors.social.cannotFollowYourself');
    await SocialDAO.unfollowUser(user.id, userId);
    return json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return json({ error: msg }, { status: 500 });
  }
};
