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

  static async getFeed(userId: User['id'], limit: number, offset: number): Promise<Publication[]> {
    const res = await pool.query<PublicationTable>(
      'SELECT * FROM publication ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    return await PublicationDAO.publicationTableToPublicationArray(res.rows, userId);
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
}
