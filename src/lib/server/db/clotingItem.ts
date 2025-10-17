import type { ClothingItem, UUID } from '$lib/types';
import sharp from 'sharp';
import pool from '.';
import { unlink } from 'fs/promises';
import { getEnv } from '../utils';

export interface ClothingItemTable {
  id: UUID;
  user_id: UUID;
}

export class ClothingItemDAO {
  static convertToClothingItem(row: ClothingItemTable): ClothingItem {
    return {
      id: row.id as UUID,
      imageUrl: `${getEnv('ORIGIN', 'http://localhost:5173')}/assets/clothing_items/${row.id}.webp`,
      type: 'top',
      color: 'unknown',
      createdAt: new Date(),
      lastWornAt: null,
    };
  }

  static async uploadClothingItem(userId: UUID, imageBuffer: Buffer): Promise<ClothingItem> {
    const res = await pool.query<ClothingItemTable>(
      'INSERT INTO clothing_items (user_id) VALUES ($1) RETURNING *',
      [userId]
    );
    if (res.rows.length === 0) {
      throw new Error('Failed to create clothing item');
    }
    const clothingItem = ClothingItemDAO.convertToClothingItem(res.rows[0]);

    // Process and save the image
    const outputPath = `assets/clothing_items/${clothingItem.id}.webp`;
    await sharp(imageBuffer)
      .resize(1024, 1024, { fit: 'inside' })
      .toFormat('webp')
      .toFile(outputPath);

    return clothingItem;
  }

  static async getClothingItemById(id: UUID): Promise<ClothingItem | null> {
    const res = await pool.query<ClothingItemTable>('SELECT * FROM clothing_items WHERE id = $1', [
      id,
    ]);
    if (res.rows.length === 0) {
      return null;
    }
    return ClothingItemDAO.convertToClothingItem(res.rows[0]);
  }

  static async getClothingItemsByUserId(userId: UUID): Promise<ClothingItem[]> {
    const res = await pool.query<ClothingItemTable>(
      'SELECT * FROM clothing_items WHERE user_id = $1',
      [userId]
    );
    return res.rows.map(ClothingItemDAO.convertToClothingItem);
  }

  static async deleteClothingItem(id: UUID): Promise<void> {
    await pool.query('DELETE FROM clothing_items WHERE id = $1', [id]);
    await unlink(`assets/clothing_items/${id}.webp`);
  }
}
