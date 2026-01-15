import { type Comment, type User, type UUID } from '$lib/types';
import pool from '.';
import { filterText } from '../socialFilter';
import { PublicationDAO } from './publication';
import { UserDAO } from './user';

export interface CommentTable {
  id: UUID;
  publication_id: UUID | null;
  comment_id: UUID | null;
  user_id: UUID;
  content: string;
  created_at: Date;
}

export class CommentDAO {
  static convertToComment(row: CommentTable, user: User, replies?: Comment[]): Comment {
    return {
      id: row.id,
      postId: row.publication_id,
      commentId: row.comment_id,
      content: row.content,
      createdAt: row.created_at,
      user,
      replies: replies ?? [],
    };
  }

  static async create(
    content: Comment['content'],
    userId: User['id'],
    { postId, commentId }: { postId?: Comment['postId']; commentId?: Comment['commentId'] }
  ): Promise<Comment> {
    if (!postId && !commentId) {
      throw new Error('Either postId or commentId must be provided');
    }
    if (postId) {
      const post = await PublicationDAO.getPublicationById(postId);
      if (!post) {
        throw new Error('errors.social.post.notFound');
      }
    } else {
      const parentComment = await this.getComment(commentId!);
      if (!parentComment) {
        throw new Error('errors.social.post.comments.parentComment.notFound');
      }
    }
    const res = await pool.query<CommentTable>(
      'INSERT INTO comment (publication_id, user_id, comment_id, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [postId ?? null, userId, commentId ?? null, filterText(content)]
    );
    return (await this.getComment(res.rows[0].id)) as Comment;
  }

  static async getComment(id: Comment['id'], replies = false): Promise<Comment | null> {
    const res = await pool.query<CommentTable>('SELECT * FROM comment WHERE id = $1', [id]);
    if (res.rowCount === 0) {
      return null;
    }
    const associatedUser = await UserDAO.getUserById(res.rows[0].user_id);
    if (replies) {
      const replies = await this.getRepliesToComment(id);
      return this.convertToComment(res.rows[0], associatedUser, replies);
    } else {
      return this.convertToComment(res.rows[0], associatedUser);
    }
  }

  private static async buildCommentTree(
    rows: CommentTable[],
    rootParentId: Comment['id'] | null
  ): Promise<Comment[]> {
    const childrenByParent = new Map<Comment['id'] | null, CommentTable[]>();
    for (const row of rows) {
      const parentId = (row.comment_id as Comment['id'] | null) ?? null;
      const existing = childrenByParent.get(parentId);
      if (existing) {
        existing.push(row);
      } else {
        childrenByParent.set(parentId, [row]);
      }
    }
    const buildForParent = async (parentId: Comment['id'] | null): Promise<Comment[]> => {
      const children = childrenByParent.get(parentId) ?? [];
      const result: Comment[] = [];
      for (const childRow of children) {
        const replies = await buildForParent(childRow.id);
        const associatedUser = await UserDAO.getUserById(childRow.user_id);
        const comment = this.convertToComment(childRow, associatedUser, replies);
        result.push(comment);
      }
      return result;
    };
    return buildForParent(rootParentId);
  }
  static async getRepliesToComment(commentId: Comment['id']): Promise<Comment[]> {
    const res = await pool.query<CommentTable>(
      `
      WITH RECURSIVE comment_tree AS (
        SELECT *
        FROM comment
        WHERE comment_id = $1
        UNION ALL
        SELECT c.*
        FROM comment c
        INNER JOIN comment_tree ct ON c.comment_id = ct.id
      )
      SELECT *
      FROM comment_tree
      ORDER BY created_at ASC
      `,
      [commentId]
    );
    return this.buildCommentTree(res.rows, commentId);
  }
  static async getCommentsForPost(postId: Comment['postId']): Promise<Comment[]> {
    const res = await pool.query<CommentTable>(
      `
      WITH RECURSIVE comment_tree AS (
        SELECT *
        FROM comment
        WHERE publication_id = $1 AND comment_id IS NULL
        UNION ALL
        SELECT c.*
        FROM comment c
        INNER JOIN comment_tree ct ON c.comment_id = ct.id
      )
      SELECT *
      FROM comment_tree
      ORDER BY created_at ASC
      `,
      [postId]
    );
    return this.buildCommentTree(res.rows, null);
  }

  static async deleteComment(commentId: Comment['id']): Promise<void> {
    await pool.query('DELETE FROM comment WHERE id = $1', [commentId]);
  }

  static async update(
    commentId: Comment['id'],
    updates: Partial<Pick<Comment, 'content'>>
  ): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }
    values.push(commentId);
    const query = `UPDATE comment SET ${fields.join(', ')} WHERE id = $${idx}`;
    await pool.query(query, values);
  }
}
