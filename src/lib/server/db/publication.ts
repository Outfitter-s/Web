import type { Outfit, Publication, User, UUID } from '$lib/types';
import pool from '.';
import { getEnv } from '../utils';
import { writeFile } from 'node:fs/promises';
import { UserDAO } from './user';
import { OutfitDAO } from './outfit';

export interface PublicationTable {
  id: UUID;
  user_id: UUID;
  description: string;
  created_at: Date;
  outfit_id?: UUID;
}

export class PublicationDAO {
  static convertToPublication(row: PublicationTable, user: User, outfit?: Outfit): Publication {
    return {
      id: row.id,
      imageUrl: `${getEnv('ORIGIN', 'http://localhost:5173')}/assets/publication/${String(row.id)}.png`,
      user,
      description: row.description,
      createAt: new Date(row.created_at),
      outfit: outfit,
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

    const user = await UserDAO.getUserById(userId);
    const outfit = (await OutfitDAO.getOutfitById(outfitId as UUID)) ?? undefined;
    const publication = PublicationDAO.convertToPublication(res.rows[0], user, outfit);

    const outputPath = new URL(publication.imageUrl).pathname.slice(1);

    await writeFile(outputPath, imageBuffer);

    return publication;
  }

  static async getPublicationById(id: UUID): Promise<Publication | null> {
    const res = await pool.query<PublicationTable>('SELECT * FROM publication WHERE id = $1', [id]);

    if (res.rows.length === 0) {
      return null;
    }

    const item = res.rows[0];
    const user = await UserDAO.getUserById(item.user_id);
    return PublicationDAO.convertToPublication(item, user);
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

  static async getAllPublication(): Promise<Publication[]> {
    const res = await pool.query<PublicationTable>(
      'SELECT * FROM publication ORDER BY created_at DESC'
    );

    if (res.rows.length === 0) {
      return [];
    }

    return await PublicationDAO.publicationTableToPublicationArray(res.rows);
  }

  static async publicationTableToPublicationArray(
    table: PublicationTable[]
  ): Promise<Publication[]> {
    const res: Publication[] = [];
    for (const row of table) {
      const user = await UserDAO.getUserById(row.user_id);
      const outfit = (await OutfitDAO.getOutfitById(row.outfit_id as UUID)) ?? undefined;
      res.push(PublicationDAO.convertToPublication(row, user, outfit));
    }
    return res;
  }
}
