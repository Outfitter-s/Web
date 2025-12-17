import { PublicationDAO } from '$lib/server/db/publication';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { ReactionDAO } from '$lib/server/db/reaction';

export const load = (async ({ params, locals }) => {
  const user = locals.user!;
  const postId = params.postId;
  const post = await PublicationDAO.getPublicationById(postId);
  if (!post) return error(404, 'errors.social.post.notFound');
  const hasUserReacted = (await ReactionDAO.getUserReaction(post.id, user.id)) ?? undefined;
  post.userReaction = hasUserReacted;
  return { post };
}) satisfies PageServerLoad;
