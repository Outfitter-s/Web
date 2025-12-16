import { PublicationDAO } from '$lib/server/db/publication';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
  const postId = params.postId;
  const post = await PublicationDAO.getPublicationById(postId);
  if (!post) return error(404, 'Post not found'); // TODO: i18n
  return { post };
}) satisfies PageServerLoad;
