import type { User, UUID } from '$lib/types';
import { sql } from 'bun';
import { UserDAO } from './user';

export class SocialDAO {
  static async getFollowingUsers(userId: User['id']): Promise<User[]> {
    const result = await sql`SELECT u.id FROM followers f
       JOIN users u ON f.following_id = u.id
       WHERE f.follower_id = ${userId}`;
    const users: User[] = [];
    for (const userId of result.rows) {
      const user = await UserDAO.getUserById(userId);
      delete user.passwordHash;
      users.push(user);
    }
    return users;
  }

  static async getNbFollowers(userId: User['id']): Promise<number> {
    const result = await sql`SELECT COUNT(*) AS nb_followers FROM followers
       WHERE following_id = ${userId}`;
    return parseInt(result.rows[0].nb_followers, 10);
  }

  static async followUser(followerId: User['id'], followingId: User['id']): Promise<void> {
    await `INSERT INTO followers (follower_id, following_id)
       VALUES (${followerId}, ${followingId})
       ON CONFLICT (follower_id, following_id) DO NOTHING`;
  }

  static async unfollowUser(followerId: User['id'], followingId: User['id']): Promise<void> {
    await sql`DELETE FROM followers
       WHERE follower_id = ${followerId} AND following_id = ${followingId}`;
  }

  static async getFollowingIds(userId: User['id']): Promise<User['id'][]> {
    const rows = await sql<{ following_id: UUID }[]>`SELECT following_id FROM followers
       WHERE follower_id = ${userId}`;
    return rows.map((row) => row.following_id);
  }

  static async searchUsers(query: string, limit: number = 6): Promise<User[]> {
    const rows = await sql<User[]>`SELECT id, username, email FROM users
       WHERE username ILIKE %${query}%
       LIMIT ${limit}`;

    return rows;
  }
}
