import type { ClothingItem, Publication, User } from '$lib/types';
import pool from '.';
import { ClothingItemDAO, type ClothingItemTable } from './clothingItem';
import { PublicationDAO } from './publication';

export interface Wrapped {
  mostWorn: ClothingItem[];
  mostLikedPost: Publication | null;
}

export class WrappedDAO {
  static async meetsPrerequisite() {
    return new Date().getMonth() === 0; // Available only in January
  }

  static async getWrapped(userId: User['id']): Promise<Wrapped | null> {
    const getMostWorn = async () => {
      const q = await pool.query<ClothingItemTable>(
        `
        SELECT
          ci.*,
          COUNT(oci.clothing_item_id) AS appearance_count
        FROM
          outfit_clothing_items oci
        JOIN
          clothing_item ci ON oci.clothing_item_id = ci.id
        JOIN
          outfit o ON oci.outfit_id = o.id
        WHERE
          o.user_id = $1
        AND EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        GROUP BY
          ci.id
        ORDER BY
          appearance_count DESC
        LIMIT 5;
        `,
        [userId]
      );
      const mostWorn: ClothingItem[] = q.rows.map((i) => ClothingItemDAO.convertToClothingItem(i));
      return mostWorn;
    };

    const getMostLikedPost = async () => {
      const q = await pool.query<{ post_id: Publication['id']; reaction_count: number }>(
        `SELECT
          p.id AS post_id,
          COUNT(r) AS reaction_count
        FROM
          publication p
        LEFT JOIN
          reaction r ON p.id = r.post_id
        WHERE
          p.user_id = $1
          AND EXTRACT(YEAR FROM p.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        GROUP BY
          p.id
        ORDER BY
          reaction_count DESC
        LIMIT 1;`,
        [userId]
      );
      if (q.rows.length === 0) {
        return null;
      }
      const post = PublicationDAO.getPublicationById(q.rows[0].post_id);
      return post;
    };

    if (!(await this.meetsPrerequisite())) {
      return null;
    }

    const wrapped: Wrapped = {
      mostWorn: await getMostWorn(),
      mostLikedPost: await getMostLikedPost(),
    };

    return wrapped;
  }
}
