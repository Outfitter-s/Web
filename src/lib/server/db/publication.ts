import type { Outfit, PostReactions, Publication, Reactions, User, UUID } from '$lib/types';
import pool from '.';
import { getEnv } from '../utils';
import { writeFile } from 'node:fs/promises';
import { UserDAO } from './user';
import { OutfitDAO } from './outfit';
import { ReactionDAO } from './reaction';

export interface PublicationTable {
  id: UUID;
  user_id: UUID;
  description: string;
  created_at: Date;
  outfit_id?: UUID;
}

export class PublicationDAO {
  static convertToPublication(
    row: PublicationTable,
    user: User,
    outfit: Outfit | undefined,
    reactions: PostReactions,
    userReaction?: Reactions
  ): Publication {
    return {
      id: row.id,
      imageUrl: `${getEnv('ORIGIN', 'http://localhost:5173')}/assets/publication/${String(row.id)}.png`,
      user,
      description: row.description,
      createAt: new Date(row.created_at),
      outfit,
      reactions,
      userReaction,
    };
  }

  static async create(
    userId: UUID,
    imageBuffer: Buffer,
    description: string,
    todaysOutfit: boolean
  ): Promise<Publication> {
    const outfitId = await OutfitDAO.getTodaysOutfitIdForUser(userId, todaysOutfit);
    const res = await pool.query<PublicationTable>(
      'INSERT INTO publication (user_id, description, outfit_id) VALUES ($1, $2, $3) RETURNING *',
      [userId, description, outfitId]
    );
    if (res.rows.length === 0) {
      throw new Error('Failed to create publication');
    }

    const post = await this.getPublicationById(res.rows[0].id);
    if (!post) {
      throw new Error('Failed to retrieve created publication');
    }

    const outputPath = new URL(post.imageUrl).pathname.slice(1);
    await writeFile(outputPath, imageBuffer);

    return post;
  }

  static async getPublicationById(id: UUID): Promise<Publication | null> {
    const res = await pool.query<PublicationTable>('SELECT * FROM publication WHERE id = $1', [id]);

    if (res.rows.length === 0) {
      return null;
    }

    const item = res.rows[0];
    const user = await UserDAO.getUserById(item.user_id);
    const outfit = (await OutfitDAO.getOutfitById(item.outfit_id as UUID)) ?? undefined;
    const reactions = await ReactionDAO.getReactionsForPost(item.id);
    return PublicationDAO.convertToPublication(item, user, outfit, reactions);
  }

  static async getPublicationByUserId(userId: UUID): Promise<Publication[]> {
    const res = await pool.query<PublicationTable>(
      'SELECT * FROM publication WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    if (res.rows.length === 0) {
      return [];
    }

    return await PublicationDAO.publicationTableToPublicationArray(res.rows);
  }

  static async getFollowedFeed(
    userId: User['id'],
    limit: number,
    seenPostIds: UUID[] = []
  ): Promise<Publication[]> {
    // Only return posts from users followed by the given user
    // Build the NOT IN clause and parameter list dynamically to avoid
    // passing the literal string 'NULL' to a UUID parameter.
    let params: Array<UUID | number> = [userId];
    let notInClause = '';
    if (seenPostIds.length > 0) {
      const placeholders = seenPostIds.map((_, i) => `$${i + 2}`).join(', ');
      notInClause = `AND p.id NOT IN (${placeholders})`;
      params = params.concat(seenPostIds);
    }
    // limit is the last parameter
    params.push(limit);

    const limitPlaceholder = `$${params.length}`;
    const res = await pool.query<PublicationTable>(
      `SELECT p.*
       FROM publication p
       JOIN followers f ON f.following_id = p.user_id
       WHERE f.follower_id = $1
       ${notInClause}
       ORDER BY p.created_at DESC
       LIMIT ${limitPlaceholder}`,
      params
    );

    return await PublicationDAO.publicationTableToPublicationArray(res.rows, userId);
  }

  // The algorithm
  static async getForYouFeed(
    userId: User['id'],
    limit: number,
    seenPostIds: UUID[] = []
  ): Promise<Publication[]> {
    const followedCandidates = await this.getFollowedFeed(
      userId,
      Math.ceil(limit * 0.6),
      seenPostIds
    );
    const trendingCandidates = await this.getPopularPublications(
      Math.ceil(limit * 0.3),
      10,
      seenPostIds
    ); // popular in last 10 days
    const map = new Map<string, Publication>();
    for (const p of [...followedCandidates, ...trendingCandidates]) {
      if (!map.has(p.id)) map.set(p.id, p);
    }
    const candidates = Array.from(map.values());

    const positiveReactionsTypes: Reactions[] = ['like', 'love', 'haha', 'wow'];
    const negativeReactionsTypes: Reactions[] = ['sad'];
    function scorePost(p: Publication): number {
      const positiveScore = p.reactions
        ? positiveReactionsTypes.reduce((sum, type) => sum + (p.reactions?.[type] ?? 0), 0)
        : 0;
      const negativeScore = p.reactions
        ? negativeReactionsTypes.reduce((sum, type) => sum + (p.reactions?.[type] ?? 0), 0)
        : 0;
      const popularity = positiveScore - negativeScore;

      const ageInHours = (Date.now() - p.createAt.getTime()) / (1000 * 60 * 60);
      const recency = 1 / (1 + ageInHours); // More recent posts have higher recency
      return 1.2 * recency + 0.8 * popularity;
    }

    candidates.sort((a, b) => scorePost(b) - scorePost(a));

    const result = candidates.slice(0, limit);
    return result;
  }

  static async publicationTableToPublicationArray(
    table: PublicationTable[],
    userId?: User['id']
  ): Promise<Publication[]> {
    const res: Publication[] = [];
    for (const row of table) {
      const user = await UserDAO.getUserById(row.user_id);
      const outfit = (await OutfitDAO.getOutfitById(row.outfit_id as UUID)) ?? undefined;
      const reactions = await ReactionDAO.getReactionsForPost(row.id);
      const hasUserReacted = userId
        ? ((await ReactionDAO.getUserReaction(row.id, userId)) ?? undefined)
        : undefined;
      res.push(PublicationDAO.convertToPublication(row, user, outfit, reactions, hasUserReacted));
    }
    return res;
  }

  static async getPopularPublications(
    limit: number,
    nbDays: number,
    seenPostIds: UUID[] = []
  ): Promise<Publication[]> {
    // Build dynamic parameter list for seenPostIds, then nbDays and limit.
    let params: Array<UUID | number | string> = [];
    let notInClause = '';
    if (seenPostIds.length > 0) {
      const placeholders = seenPostIds.map((_, i) => `$${i + 1}`).join(', ');
      notInClause = `WHERE p.id NOT IN (${placeholders})`;
      params = params.concat(seenPostIds);
    }

    // nbDays as interval string (e.g. '10 days')
    params.push(`${nbDays} days`);
    params.push(limit);

    // nbDays placeholder index is params.length - 1, limit is params.length
    const nbDaysPlaceholder = `$${params.length - 1}`;
    const limitPlaceholder = `$${params.length}`;

    const res = await pool.query<PublicationTable>(
      `SELECT p.*
       FROM publication p
       LEFT JOIN reaction r ON p.id = r.post_id AND r.created_at >= NOW() - ${nbDaysPlaceholder}::interval
       ${notInClause}
       GROUP BY p.id
       ORDER BY COUNT(r.type) DESC, p.created_at DESC
       LIMIT ${limitPlaceholder}`,
      params
    );

    return await PublicationDAO.publicationTableToPublicationArray(res.rows);
  }
}
