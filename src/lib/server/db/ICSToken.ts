import type { ICSToken, User, UUID } from '$lib/types';
import { sql } from 'bun';

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
    const rows = await sql<ICSTokenTable[]>`SELECT * FROM ics_token WHERE id = ${token}`;
    if (rows.length === 0) {
      return null;
    }
    return ICSTokenDAO.convertToToken(rows[0]);
  }

  static async getAllForUser(userId: User['id']): Promise<ICSToken[]> {
    const rows = await sql<ICSTokenTable[]>`SELECT * FROM ics_token WHERE user_id = ${userId}`;
    return rows.map(ICSTokenDAO.convertToToken);
  }

  static async createToken(userId: User['id']): Promise<ICSToken> {
    const rows = await sql<
      ICSTokenTable[]
    >`INSERT INTO ics_token (user_id) VALUES (${userId}) RETURNING *`;
    return ICSTokenDAO.convertToToken(rows[0]);
  }

  static async revokeToken(token: UUID) {
    await sql`DELETE FROM ics_token WHERE id = ${token}`;
  }
}
