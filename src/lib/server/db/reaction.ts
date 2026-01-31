import type { PostReactions, Reactions, UUID } from '$lib/types';
import { sql } from 'bun';
// import { Caching } from './caching';

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
    await sql`INSERT INTO reaction (post_id, user_id, type)
       VALUES (${postId}, ${userId}, ${type})
       ON CONFLICT (post_id, user_id)
       DO UPDATE SET type = EXCLUDED.type, created_at = NOW()`;
    return type;
  }

  static async removeReaction(postId: UUID, userId: UUID): Promise<void> {
    // await Caching.del(`reaction:post:${postId}`);
    await sql`DELETE FROM reaction
       WHERE post_id = ${postId} AND user_id = ${userId}`;
  }

  static async getReactionsForPost(postId: UUID): Promise<PostReactions> {
    // const cached = await Caching.get<PostReactions>(`reaction:post:${postId}`);
    // if (cached) {
    //   return cached;
    // }
    const rows = await sql<ReactionTable[]>`SELECT * FROM reaction
       WHERE post_id = ${postId}`;
    const reactionsCount: PostReactions = {
      like: 0,
      love: 0,
      haha: 0,
      wow: 0,
      sad: 0,
    };

    for (const row of rows) {
      reactionsCount[row.type]++;
    }
    // await Caching.set(`reaction:post:${postId}`, reactionsCount);

    return reactionsCount;
  }

  static async getUserReaction(postId: UUID, userId: UUID): Promise<Reactions | null> {
    // const cached = await Caching.get<Reactions>(`reaction:post:${postId}:user:${userId}`);
    // if (cached) {
    //   return cached;
    // }
    const rows = await sql<ReactionTable[]>`SELECT * FROM reaction
       WHERE post_id = ${postId} AND user_id = ${userId}`;
    if (rows.length === 0) {
      return null;
    }
    const reaction = rows[0].type;
    // await Caching.set(`reaction:post:${postId}:user:${userId}`, reaction);
    return reaction;
  }
}
