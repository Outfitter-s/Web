import type { ICSToken, User, UUID } from '$lib/types';
import pool from '.';

export interface ICSTokenTable {
  id: UUID;
  user_id: UUID;
}
export class ICSTokenDAO {
  static convertToToken(row: ICSTokenTable): ICSToken {
    return {
      id: row.id,
      userId: row.user_id,
    };
  }

  static async getFromToken(token: UUID): Promise<ICSToken | null> {
    const result = await pool.query<ICSTokenTable>('SELECT * FROM ics_token WHERE id = $1', [
      token,
    ]);
    if (result.rows.length === 0) {
      return null;
    }
    return ICSTokenDAO.convertToToken(result.rows[0]);
  }

  static async getAllForUser(userId: User['id']): Promise<ICSToken[]> {
    const result = await pool.query<ICSTokenTable>('SELECT * FROM ics_token WHERE user_id = $1', [
      userId,
    ]);
    return result.rows.map(ICSTokenDAO.convertToToken);
  }

  static async createToken(userId: User['id']): Promise<ICSToken> {
    const result = await pool.query<ICSTokenTable>(
      'INSERT INTO ics_token (user_id) VALUES ($1) RETURNING *',
      [userId]
    );
    return ICSTokenDAO.convertToToken(result.rows[0]);
  }

  static async revokeToken(token: UUID) {
    await pool.query('DELETE FROM ics_token WHERE id = $1', [token]);
  }
}
