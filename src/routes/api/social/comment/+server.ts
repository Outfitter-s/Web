import z from 'zod';
import type { RequestHandler } from './$types';
import { CommentZ, UUID } from '$lib/types';
import { CommentDAO } from '$lib/server/db/comment';
import { json } from '@sveltejs/kit';

export const DELETE: RequestHandler = async ({ locals, url }) => {
  const schema = z.object({
    commentId: UUID,
  });
  try {
    const user = locals.user!;
    const params = url.searchParams;
    const body = {
      commentId: params.get('commentId'),
    };
    const data = schema.safeParse(body);
    if (!data.success) throw new Error(data.error.issues.map((i) => i.message).join(', '));
    const { commentId } = data.data;
    const comment = await CommentDAO.getComment(commentId, false);
    if (!comment) {
      throw new Error('errors.social.post.comment.notFound');
    }
    if (comment.user.id !== user.id) {
      throw new Error('errors.social.post.comment.deleteFailed');
    }
    await CommentDAO.deleteComment(commentId);
    return json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return json(
      {
        message: msg || 'errors.server.connectionRefused',
      },
      { status: 400 }
    );
  }
};

export const PATCH: RequestHandler = async ({ locals, request }) => {
  const schema = z.object({
    id: UUID,
    content: z.string().trim().min(1).max(500),
  });
  try {
    const user = locals.user!;
    const body = await request.json();
    const data = schema.safeParse(body);
    if (!data.success) throw new Error(data.error.issues.map((i) => i.message).join(', '));
    const { id, content } = data.data;
    const comment = await CommentDAO.getComment(id, false);

    if (!comment) throw new Error('errors.social.post.comment.notFound');
    if (comment.user.id !== user.id) throw new Error('errors.social.post.comment.deleteFailed');

    await CommentDAO.update(id, { content });
    return json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return json(
      {
        message: msg || 'errors.server.connectionRefused',
      },
      { status: 400 }
    );
  }
};
