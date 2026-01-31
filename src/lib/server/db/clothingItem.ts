import type { ClothingItem, UUID } from '$lib/types';
import { unlink, writeFile } from 'node:fs/promises';
import { getEnv } from '../utils';
import { Caching } from './caching';
import { sql } from 'bun';

export interface ClothingItemTable {
  id: UUID;
  user_id: UUID;
  name: string;
  description: string;
  type: ClothingItem['type'];
  color: ClothingItem['color'];
  pattern: ClothingItem['pattern'];
  created_at: Date;
}

export class ClothingItemDAO {
  static convertToClothingItem(
    row: ClothingItemTable,
    lastWornAt: Date | null = null
  ): ClothingItem {
    return {
      id: row.id,
      imageUrl: `${getEnv('ORIGIN', 'http://localhost:5173')}/assets/clothing_item/${String(row.id)}.png`,
      type: row.type as ClothingItem['type'],
      color: row.color as ClothingItem['color'],
      pattern: row.pattern as ClothingItem['pattern'],
      description: String(row.description ?? ''),
      name: String(row.name ?? ''),
      createdAt: new Date(row.created_at),
      lastWornAt,
      userId: row.user_id,
    };
  }

  static async uploadClothingItem(
    userId: UUID,
    imageBuffer: Buffer,
    name: ClothingItem['name'],
    description: ClothingItem['description'],
    type: ClothingItem['type'],
    color: ClothingItem['color'],
    pattern: ClothingItem['pattern']
  ): Promise<ClothingItem> {
    const [row] = await sql<
      ClothingItemTable[]
    >`INSERT INTO clothing_item (user_id, name, description, type, color, pattern) VALUES (${userId}, ${name}, ${description}, ${type}, ${color}, ${pattern}) RETURNING *`;
    if (!row) {
      throw new Error('Failed to create clothing item');
    }
    const clothingItem = ClothingItemDAO.convertToClothingItem(row);
    await ClothingItemDAO.writeClothingItemImage(clothingItem.id, imageBuffer);

    return clothingItem;
  }

  static async getClothingItemById(id: UUID): Promise<ClothingItem | null> {
    const cached = await Caching.get<ClothingItem>(`clothingItem:${id}`);
    if (cached) return cached;

    const res = await sql<ClothingItemTable[]>`SELECT * FROM clothing_item WHERE id = ${id}`;
    if (res.length === 0) {
      return null;
    }
    const item = res[0];
    const lastWornAt = await ClothingItemDAO.getLastWornAt(item.id);
    const clothingItem = ClothingItemDAO.convertToClothingItem(item, lastWornAt);
    await Caching.set(`clothingItem:${id}`, clothingItem);
    return clothingItem;
  }

  static async getClothingItemsByUserId(userId: UUID): Promise<ClothingItem[]> {
    const rows = await sql<
      ClothingItemTable[]
    >`SELECT * FROM clothing_item WHERE user_id = ${userId} ORDER BY created_at DESC`;
    const clothingItems: ClothingItem[] = [];
    for (const row of rows) {
      const lastWornAt = await ClothingItemDAO.getLastWornAt(row.id);
      clothingItems.push(ClothingItemDAO.convertToClothingItem(row, lastWornAt));
    }
    return clothingItems;
  }

  static async deleteClothingItem(id: UUID): Promise<void> {
    await sql`DELETE FROM clothing_item WHERE id = ${id}`;
    await unlink(`assets/clothing_item/${id}.png`);
    await Caching.del(`clothingItem:${id}`);
  }

  static async getLastWornAt(item: UUID): Promise<Date | null> {
    const cached = await Caching.get<ClothingItem>(`clothingItem:${item}`);
    if (cached && cached.lastWornAt) {
      return cached.lastWornAt;
    }
    interface LastWornAtResult {
      last_worn_at: Date | null;
    }
    const rows = await sql<
      LastWornAtResult[]
    >`SELECT MAX(outfit.created_at) as last_worn_at FROM outfit INNER JOIN outfit_clothing_items ON outfit.id = outfit_clothing_items.outfit_id WHERE outfit_clothing_items.clothing_item_id = ${item}`;
    return rows[0].last_worn_at;
  }

  static async updateClothingItem(item: ClothingItem): Promise<void> {
    const rows = await sql<
      ClothingItemTable[]
    >`UPDATE clothing_item SET ${sql(item, 'name', 'description', 'type', 'color', 'pattern')} WHERE id = ${item.id} RETURNING *`;
    if (rows.length === 0) {
      throw new Error('Failed to update clothing item');
    }
    await Caching.del(`clothingItem:${item.id}`);
  }

  static async writeClothingItemImage(id: UUID, imageBuffer: Buffer): Promise<void> {
    const outputPath = `assets/clothing_item/${id}.png`;
    await writeFile(outputPath, imageBuffer);
  }

  static async getOwner(clothingItemId: UUID): Promise<UUID | null> {
    const cached = await Caching.get<ClothingItem>(`clothingItem:${clothingItemId}`);
    if (cached && cached.userId) return cached.userId;

    const rows = await sql<
      { user_id: UUID }[]
    >`SELECT user_id FROM clothing_item WHERE id = ${clothingItemId}`;
    if (rows.length === 0) {
      return null;
    }
    return rows[0].user_id;
  }
}
