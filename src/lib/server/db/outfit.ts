import type { ClothingItem, ClothingItemType, Outfit, OutfitPreview, UUID } from '$lib/types';
import { Caching } from './caching';
import { ClothingItemDAO } from './clothingItem';
import { sql } from 'bun';

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
    const cached = await Caching.get<Outfit>(`outfit:${id}`);
    if (cached) return cached;
    const rows = await sql<OutfitTable[]>`SELECT * FROM outfit WHERE id = ${id}`;
    if (rows.length === 0) {
      return null;
    }

    const itemsRes = await sql<
      OutfitItemTable[]
    >`SELECT * FROM outfit_clothing_items WHERE outfit_id = ${id}`;
    const clothingItemIds = itemsRes.map((row) => row.clothing_item_id);

    const clothingItems: ClothingItem[] = [];
    for (const clothingItemId of clothingItemIds) {
      const item = await ClothingItemDAO.getClothingItemById(clothingItemId);
      if (item) {
        clothingItems.push(item);
      }
    }

    const outfit = OutfitDAO.convertToOutfit(rows[0], clothingItems);
    await Caching.set(`outfit:${id}`, outfit);
    return outfit;
  }

  static async getAllUserOutfits(userId: UUID, past = false): Promise<Outfit[]> {
    const rows = await sql<
      OutfitTable[]
    >`SELECT * FROM outfit WHERE user_id = ${userId} AND created_at >= ${past ? new Date(0) : new Date(new Date().setHours(0, 0, 0, 0))} ORDER BY created_at DESC`;

    const outfits: Outfit[] = [];

    for (const row of rows) {
      const itemsRows = await sql<
        OutfitItemTable[]
      >`SELECT * FROM outfit_clothing_items WHERE outfit_id = ${row.id}`;
      const clothingItemIds = itemsRows.map((r) => r.clothing_item_id);

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

  static async createOutfit(
    userId: UUID,
    outfit: OutfitPreview & { createdAt?: Date }
  ): Promise<Outfit> {
    const rows = await sql<
      OutfitTable[]
    >`INSERT INTO outfit (user_id, created_at) VALUES (${userId}, ${outfit.createdAt ?? new Date()}) RETURNING *`;
    if (rows.length === 0) {
      throw new Error('Failed to create outfit');
    }
    const outfitRow = rows[0];

    for (const item of outfit.items) {
      await sql`INSERT INTO outfit_clothing_items (outfit_id, clothing_item_id) VALUES (${outfitRow.id}, ${item.id})`;
    }

    return this.getOutfitById(outfitRow.id) as Promise<Outfit>;
  }

  static async deleteOutfit(outfitId: UUID): Promise<void> {
    // Remove references from associated posts
    await sql`UPDATE publication SET outfit_id = NULL WHERE outfit_id = ${outfitId}`;
    await sql`DELETE FROM outfit_clothing_items WHERE outfit_id = ${outfitId}`;
    await sql`DELETE FROM outfit WHERE id = ${outfitId}outfitId}`;
    await Caching.del(`outfit:${outfitId}`);
  }

  static async outfitBelongsToUser(userId: UUID, outfitId: UUID): Promise<void> {
    const rows = await sql<
      OutfitTable[]
    >`SELECT * FROM outfit WHERE id = ${outfitId} AND user_id = ${userId}`;
    if (rows.length === 0) throw new Error('errors.clothing.outfit.notAuthorized');
  }

  static async getTodaysOutfitIdForUser(
    userId: UUID,
    todaysOutfit: boolean | undefined
  ): Promise<UUID | null> {
    if (!todaysOutfit) return null;

    const rows = await sql<
      OutfitTable[]
    >`SELECT * FROM outfit WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 1`;
    if (rows.length === 0) {
      return null;
    }

    return rows[0].id;
  }
}
