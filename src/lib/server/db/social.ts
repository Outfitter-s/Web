import type { User } from '$lib/types';
import pool from '.';
import { UserDAO } from './user';

interface FollowerTable {
  id: number;
  follower_id: User['id'];
  following_id: User['id'];
  created_at: Date;
}

export class SocialDAO {
  static async getFollowingUsers(userId: User['id']): Promise<User[]> {
    const result = await pool.query(
      `SELECT u.id FROM followers f
       JOIN users u ON f.following_id = u.id
       WHERE f.follower_id = $1`,
      [userId]
    );

    const users: User[] = [];
    for (const userId of result.rows) {
      const user = await UserDAO.getUserById(userId);
      delete user.passwordHash;
      users.push(user);
    }
    return users;
  }

  static async getNbFollowers(userId: User['id']): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(*) AS nb_followers FROM followers
       WHERE following_id = $1`,
      [userId]
    );
    return parseInt(result.rows[0].nb_followers, 10);
  }

  static async followUser(followerId: User['id'], followingId: User['id']): Promise<void> {
    await pool.query(
      `INSERT INTO followers (follower_id, following_id)
       VALUES ($1, $2)
       ON CONFLICT (follower_id, following_id) DO NOTHING`,
      [followerId, followingId]
    );
  }

  static async unfollowUser(followerId: User['id'], followingId: User['id']): Promise<void> {
    await pool.query(
      `DELETE FROM followers
       WHERE follower_id = $1 AND following_id = $2`,
      [followerId, followingId]
    );
  }

  static async getFollowingIds(userId: User['id']): Promise<User['id'][]> {
    const result = await pool.query(
      `SELECT following_id FROM followers
       WHERE follower_id = $1`,
      [userId]
    );
    return result.rows.map((row) => row.following_id);
  }

  static async searchUsers(query: string): Promise<User[]> {
    const result = await pool.query(
      `SELECT id, username, email FROM users
       WHERE username ILIKE $1
       LIMIT 10`,
      [`%${query}%`]
    );

    return result.rows;
  }
}
