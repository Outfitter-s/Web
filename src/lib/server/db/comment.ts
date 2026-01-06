import { type Comment, type User, type UUID } from '$lib/types';
import pool from '.';
import { filterText } from '../socialFilter';
import { UserDAO } from './user';

export interface CommentTable {
  id: UUID;
  post_id: UUID | null;
  comment_id: UUID | null;
  user_id: UUID;
  content: string;
  created_at: Date;
}

export class CommentDAO {
  static convertToComment(row: CommentTable, user: User, replies?: Comment[]): Comment {
    return {
      id: row.id,
      postId: row.post_id,
      commentId: row.comment_id,
      content: row.content,
      createdAt: row.created_at,
      user,
      replies: replies ?? [],
    };
  }

  static async create(
    content: Comment['content'],
    { postId, commentId }: { postId?: Comment['postId']; commentId?: Comment['commentId'] }
  ): Promise<Comment> {
    const res = await pool.query<CommentTable>(
      'INSERT INTO comment (post_id, comment_id, content, created_at) VALUES ($1, $2, $3) RETURNING *',
      [postId ?? null, commentId ?? null, filterText(content)]
    );
    return (await this.getComment(res.rows[0].id)) as Comment;
  }

  static async getComment(id: Comment['id']): Promise<Comment | null> {
    const res = await pool.query<CommentTable>('SELECT * FROM comment WHERE id = $1', [id]);
    if (res.rowCount === 0) {
      return null;
    }
    const replies = await this.getRepliesToComment(id);
    const associatedUser = await UserDAO.getUserById(res.rows[0].user_id);
    return this.convertToComment(res.rows[0], associatedUser, replies);
  }

  static async getRepliesToComment(commentId: Comment['id']): Promise<Comment[]> {
    const res = await pool.query<CommentTable>(
      'SELECT id FROM comment WHERE comment_id = $1 ORDER BY created_at ASC',
      [commentId]
    );
    const replies: Comment[] = [];
    for (const commentId of res.rows) {
      const comment = await this.getComment(commentId.id);
      if (comment) replies.push(comment);
    }
    return replies;
  }

  static async getCommentsForPost(postId: Comment['postId']): Promise<Comment[]> {
    const res = await pool.query<CommentTable>(
      'SELECT id FROM comment WHERE post_id = $1 AND comment_id IS NULL ORDER BY created_at ASC',
      [postId]
    );
    const comments: Comment[] = [];
    for (const commentId of res.rows) {
      const comment = await this.getComment(commentId.id);
      if (comment) comments.push(comment);
    }
    return comments;
  }
}
