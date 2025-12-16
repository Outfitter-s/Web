import type { Publication, UUID } from '$lib/types';
import { dirname } from 'node:path';
import pool from '.';
import { getEnv } from '../utils';
import { mkdir, writeFile } from 'node:fs/promises';

export interface PublicationTable {
  id: UUID;
  user_id: UUID;
  description: string;
  created_at: Date;
}

export class PublicationDAO {
  static convertToPublication(row: PublicationTable): Publication {
    return {
      id: row.id,
      imageUrl: `${getEnv('ORIGIN', 'http://localhost:5173')}/assets/publication/${String(row.id)}.png`,
      userId: row.user_id,
      description: row.description,
      createAt: new Date(row.created_at),
    };
  }

  static async create(
    userId: UUID,
    imageBuffer: Buffer,
    description: string
  ): Promise<Publication> {
    const res = await pool.query<PublicationTable>(
      'INSERT INTO publication (user_id, description) VALUES ($1, $2) RETURNING *',
      [userId, description]
    );
    if (res.rows.length === 0) {
      throw new Error('Failed to create publication');
    }

    const publication = PublicationDAO.convertToPublication(res.rows[0]);

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
    return PublicationDAO.convertToPublication(item);
  }

  static async getPublicationByUserId(userId: UUID): Promise<Publication[]> {
    const res = await pool.query<PublicationTable>('SELECT * FROM publication WHERE user_id = $1', [
      userId,
    ]);

    if (res.rows.length === 0) {
      return [];
    }

    return PublicationDAO.publicationTableToPublicationArray(res.rows);
  }

  static async getAllPublication(): Promise<Publication[]> {
    const res = await pool.query<PublicationTable>('SELECT * FROM publication');

    if (res.rows.length === 0) {
      return [];
    }

    return PublicationDAO.publicationTableToPublicationArray(res.rows);
  }

  static publicationTableToPublicationArray(table: PublicationTable[]): Publication[] {
    const res: Publication[] = [];
    for (let row of table) {
      res.push(PublicationDAO.convertToPublication(row));
    }
    return res;
  }
}
