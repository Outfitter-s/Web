import { PublicationDAO } from '$lib/server/db/publication';
import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { ReactionDAO } from '$lib/server/db/reaction';
import { CommentDAO } from '$lib/server/db/comment';
import z from 'zod';

export const load = (async ({ params, locals }) => {
  const user = locals.user!;
  const postId = params.postId;
  const post = await PublicationDAO.getPublicationById(postId);
  if (!post) return error(404, 'errors.social.post.notFound');
  const hasUserReacted = (await ReactionDAO.getUserReaction(post.id, user.id)) ?? undefined;
  post.userReaction = hasUserReacted;
  return { post };
}) satisfies PageServerLoad;

export const actions: Actions = {
  delete: async ({ locals, params }) => {
    const { postId } = params;
    const user = locals.user!;
    try {
      const owner = await PublicationDAO.getOwner(postId);
      if (!owner || owner !== user.id) {
        return fail(404, { message: 'errors.social.post.notFound', action: 'delete' });
      }
      await PublicationDAO.deletePublication(postId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return fail(500, { message: msg, action: 'delete' });
    }
    return redirect(303, '/app/feed');
  },

  newComment: async ({ locals, params, request }) => {
    const schema = z.object({
      content: z.string().min(1, 'errors.social.post.comments.addComment.empty'),
      parentCommentId: z.string().optional(),
    });
    const user = locals.user!;
    const postId = params.postId;
    const formData = Object.fromEntries(await request.formData());
    const form = schema.safeParse(formData);
    if (!form.success) throw new Error(form.error.issues[0].message);
    const { content, parentCommentId } = form.data;

    try {
      await CommentDAO.create(content.trim(), user.id, { postId, commentId: parentCommentId });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return fail(500, { message: msg, action: 'newComment' });
    }

    return { success: true, action: 'newComment' };
  },
};
