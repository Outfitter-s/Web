import type { PostReactions, Reactions, UUID } from '$lib/types';
import pool from '.';

export interface ReactionTable {
  post_id: UUID;
  user_id: UUID;
  type: Reactions;
  created_at: Date;
}

export class ReactionDAO {
  static async reactToPost(postId: UUID, userId: UUID, type: Reactions): Promise<Reactions | null> {
    const currentReaction = await this.getUserReaction(postId, userId);
    if (currentReaction === type) {
      // If the reaction is the same as the current one, remove it
      await this.removeReaction(postId, userId);
      return null;
    }
    await pool.query(
      `INSERT INTO reaction (post_id, user_id, type)
       VALUES ($1, $2, $3)
       ON CONFLICT (post_id, user_id)
       DO UPDATE SET type = EXCLUDED.type, created_at = NOW()`,
      [postId, userId, type]
    );
    return type;
  }

  static async removeReaction(postId: UUID, userId: UUID): Promise<void> {
    await pool.query(
      `DELETE FROM reaction
       WHERE post_id = $1 AND user_id = $2`,
      [postId, userId]
    );
  }

  static async getReactionsForPost(postId: UUID): Promise<PostReactions> {
    const res = await pool.query<ReactionTable>(
      `SELECT * FROM reaction
       WHERE post_id = $1`,
      [postId]
    );
    const reactionsCount: PostReactions = {
      like: 0,
      love: 0,
      haha: 0,
      wow: 0,
      sad: 0,
    };

    for (const row of res.rows) {
      reactionsCount[row.type]++;
    }

    return reactionsCount;
  }

  static async getUserReaction(postId: UUID, userId: UUID): Promise<Reactions | null> {
    const res = await pool.query<ReactionTable>(
      `SELECT * FROM reaction
       WHERE post_id = $1 AND user_id = $2`,
      [postId, userId]
    );
    if (res.rows.length === 0) {
      return null;
    }
    return res.rows[0].type;
  }
}
