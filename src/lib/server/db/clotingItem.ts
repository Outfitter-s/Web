import type { ClothingItem, UUID } from '$lib/types';
import sharp from 'sharp';
import pool from '.';
import { unlink } from 'fs/promises';
import { getEnv } from '../utils';
import { ImageProcessor } from '../imageProcessing';

export interface ClothingItemTable {
  id: UUID;
  user_id: UUID;
  name: string;
  description: string;
  type: ClothingItem['type'];
  color: ClothingItem['color'];
  created_at: Date;
}

export class ClothingItemDAO {
  static convertToClothingItem(row: ClothingItemTable): ClothingItem {
    return {
      id: row.id as UUID,
      imageUrl: `${getEnv('ORIGIN', 'http://localhost:5173')}/assets/clothing_item/${row.id}.webp`,
      type: row.type,
      color: row.color,
      description: row.description,
      name: row.name,
      createdAt: new Date(),
      lastWornAt: null,
    };
  }

  static async uploadClothingItem(
    userId: UUID,
    imageBuffer: Buffer,
    name: ClothingItem['name'],
    description: ClothingItem['description'],
    type: ClothingItem['type'],
    color: ClothingItem['color']
  ): Promise<ClothingItem> {
    const res = await pool.query<ClothingItemTable>(
      'INSERT INTO clothing_item (user_id, name, description, type, color) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, name, description, type, color]
    );
    if (res.rows.length === 0) {
      throw new Error('Failed to create clothing item');
    }
    const clothingItem = ClothingItemDAO.convertToClothingItem(res.rows[0]);

    // Process and save the image
    const outputPath = `assets/clothing_item/${clothingItem.id}.webp`;
    const processedImage = await ImageProcessor.removeBackground(imageBuffer);
    await sharp(processedImage)
      .resize(1024, 1024, { fit: 'inside' })
      .toFormat('webp')
      .toFile(outputPath);

    return clothingItem;
  }

  static async getClothingItemById(id: UUID): Promise<ClothingItem | null> {
    const res = await pool.query<ClothingItemTable>('SELECT * FROM clothing_item WHERE id = $1', [
      id,
    ]);
    if (res.rows.length === 0) {
      return null;
    }
    return ClothingItemDAO.convertToClothingItem(res.rows[0]);
  }

  static async getClothingItemsByUserId(userId: UUID): Promise<ClothingItem[]> {
    const res = await pool.query<ClothingItemTable>(
      'SELECT * FROM clothing_item WHERE user_id = $1',
      [userId]
    );
    return res.rows.map(ClothingItemDAO.convertToClothingItem);
  }

  static async deleteClothingItem(id: UUID): Promise<void> {
    await pool.query('DELETE FROM clothing_item WHERE id = $1', [id]);
    await unlink(`assets/clothing_item/${id}.webp`);
  }
}
