import type { ClothingItem, ClothingItemType, Outfit, OutfitPreview, UUID } from '$lib/types';
import pool from '.';
import { ClothingItemDAO } from './clothingItem';

export interface OutfitTable {
  id: UUID;
  user_id: UUID;
  created_at: Date;
}
export interface OutfitItemTable {
  outfit_id: UUID;
  clothing_item_id: UUID;
  position: ClothingItemType;
}

export class OutfitDAO {
  static convertToOutfit(row: OutfitTable, items: ClothingItem[]): Outfit {
    return {
      id: row.id,
      items,
      createdAt: new Date(row.created_at),
    };
  }

  static async getOutfitById(id: UUID): Promise<Outfit | null> {
    const res = await pool.query<OutfitTable>('SELECT * FROM outfit WHERE id = $1', [id]);
    if (res.rows.length === 0) {
      return null;
    }

    const itemsRes = await pool.query<OutfitItemTable>(
      'SELECT * FROM outfit_clothing_items WHERE outfit_id = $1',
      [id]
    );
    const clothingItemIds = itemsRes.rows.map((row) => row.clothing_item_id);

    const clothingItems: ClothingItem[] = [];
    for (const clothingItemId of clothingItemIds) {
      const item = await ClothingItemDAO.getClothingItemById(clothingItemId);
      if (item) {
        clothingItems.push(item);
      }
    }

    return OutfitDAO.convertToOutfit(res.rows[0], clothingItems);
  }

  static async getAllUserOutfits(userId: UUID): Promise<Outfit[]> {
    const res = await pool.query<OutfitTable>(
      'SELECT * FROM outfit WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    const outfits: Outfit[] = [];

    for (const row of res.rows) {
      const itemsRes = await pool.query<OutfitItemTable>(
        'SELECT * FROM outfit_clothing_items WHERE outfit_id = $1',
        [row.id]
      );
      const clothingItemIds = itemsRes.rows.map((r) => r.clothing_item_id);

      const clothingItems: ClothingItem[] = [];
      for (const clothingItemId of clothingItemIds) {
        const item = await ClothingItemDAO.getClothingItemById(clothingItemId);
        if (item) {
          clothingItems.push(item);
        }
      }

      outfits.push(OutfitDAO.convertToOutfit(row, clothingItems));
    }

    return outfits;
  }

  static async createOutfit(userId: UUID, outfit: OutfitPreview): Promise<Outfit> {
    const res = await pool.query<OutfitTable>(
      'INSERT INTO outfit (user_id) VALUES ($1) RETURNING *',
      [userId]
    );
    if (res.rows.length === 0) {
      throw new Error('Failed to create outfit');
    }
    const outfitRow = res.rows[0];

    for (const item of outfit.items) {
      await pool.query(
        'INSERT INTO outfit_clothing_items (outfit_id, clothing_item_id) VALUES ($1, $2)',
        [outfitRow.id, item.id]
      );
    }

    return this.getOutfitById(outfitRow.id) as Promise<Outfit>;
  }

  static async deleteOutfit(outfitId: UUID): Promise<void> {
    // Remove references from associated posts
    await pool.query('UPDATE publication SET outfit_id = NULL WHERE outfit_id = $1', [outfitId]);
    await pool.query('DELETE FROM outfit_clothing_items WHERE outfit_id = $1', [outfitId]);
    await pool.query('DELETE FROM outfit WHERE id = $1', [outfitId]);
  }

  static async outfitBelongsToUser(userId: UUID, outfitId: UUID): Promise<void> {
    const res = await pool.query<OutfitTable>(
      'SELECT * FROM outfit WHERE id = $1 AND user_id = $2',
      [outfitId, userId]
    );
    if (res.rows.length === 0) throw new Error('errors.clothing.outfit.notAuthorized');
  }

  static async getTodaysOutfitIdForUser(
    userId: UUID,
    todaysOutfit: boolean | undefined
  ): Promise<UUID | null> {
    if (!todaysOutfit) return null;

    const res = await pool.query<OutfitTable>(
      'SELECT * FROM outfit WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    if (res.rows.length === 0) {
      return null;
    }

    return res.rows[0].id;
  }
}
