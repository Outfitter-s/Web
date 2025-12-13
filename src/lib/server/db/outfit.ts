import type { ClothingItem, ClothingItemType, Outfit, OutfitPreview, UUID } from '$lib/types';
import pool from '.';
import { ClothingItemDAO } from './clotingItem';

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
    const byType: Record<ClothingItemType, ClothingItem[]> = {
      pants: [],
      sweater: [],
      dress: [],
      jacket: [],
      shirt: [],
      shoes: [],
      accessory: [],
    };
    for (const item of items) {
      byType[item.type].push(item);
    }

    return {
      id: row.id,
      top: [...byType.shirt, ...byType.dress],
      bottom: byType.pants[0] || null,
      shoes: byType.shoes[0] || null,
      accessories: byType.accessory,
      createdAt: new Date(row.created_at),
      wornAt: [],
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
    const res = await pool.query<OutfitTable>('SELECT * FROM outfit WHERE user_id = $1', [userId]);
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

    for (const item of [
      ...(outfit.top || []),
      outfit.bottom,
      outfit.shoes,
      ...(outfit.accessories || []),
    ]) {
      if (item) {
        await pool.query(
          'INSERT INTO outfit_clothing_items (outfit_id, clothing_item_id, position) VALUES ($1, $2, $3)',
          [outfitRow.id, item.id, item.type]
        );
      }
    }

    return this.getOutfitById(outfitRow.id) as Promise<Outfit>;
  }
}
