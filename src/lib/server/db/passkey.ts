import type { Passkey, User, UUID } from '$lib/types';
import type {
  AuthenticatorTransportFuture,
  CredentialDeviceType,
  WebAuthnCredential,
} from '@simplewebauthn/browser';
import pool from '.';
import { Caching } from './caching';
import { UserDAO } from './user';
import { getEnv } from '../utils';

export const rpName = 'Outfitter';
export const rpID = getEnv('ORIGIN', 'localhost:5173').replace(/^https?:\/\//, '');
export const origin = getEnv('ORIGIN', 'http://localhost:5173');

export interface PasskeyTable {
  id: UUID;
  public_key: string;
  user_id: UUID;
  webauthn_id: string;
  counter: string;
  device_type: string;
  backed_up: boolean;
  transport: string;
  created_at: string;
}
export class PasskeyDAO {
  static convertToPasskey(row: PasskeyTable): Passkey {
    return {
      id: row.id,
      publicKey: new Uint8Array(Buffer.from(row.public_key, 'base64')),
      webauthnUserID: row.webauthn_id,
      counter: parseInt(row.counter, 10),
      deviceType: row.device_type as CredentialDeviceType,
      backedUp: row.backed_up,
      transports: row.transport
        ? (JSON.parse(row.transport) as AuthenticatorTransportFuture[])
        : undefined,
    };
  }

  static async getUserPasskey(userId: User['id']): Promise<Passkey | null> {
    const cachedPasskey = await Caching.get<Passkey>(`user:${userId}:passkey`);
    if (cachedPasskey) return cachedPasskey;

    const result = await pool.query<PasskeyTable>('SELECT * FROM passkey WHERE user_id = $1', [
      userId,
    ]);
    if (result.rows.length === 0) {
      return null;
    }
    const passkey = PasskeyDAO.convertToPasskey(result.rows[0]);
    await Caching.set(`user:${userId}:passkey`, passkey);
    return passkey;
  }

  static async createPasskey(userId: User['id'], credential: WebAuthnCredential): Promise<Passkey> {
    const existingPasskey = await PasskeyDAO.getUserPasskey(userId);
    if (existingPasskey && existingPasskey.webauthnUserID === credential.id) {
      throw new Error('errors.auth.passkeyAlreadyExists');
    }

    const newPasskey: PasskeyTable = {
      id: crypto.randomUUID() as UUID,
      public_key: Buffer.from(credential.publicKey).toString('base64'),
      user_id: userId,
      webauthn_id: credential.id,
      counter: credential.counter.toString(),
      device_type: credential.transports?.[0] || 'unknown',
      backed_up: false,
      transport: JSON.stringify(credential.transports || []),
      created_at: new Date().toISOString(),
    };
    const result = await pool.query(
      'INSERT INTO passkey (id, public_key, user_id, webauthn_id, counter, device_type, backed_up, transport) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [
        newPasskey.id,
        Buffer.from(newPasskey.public_key, 'base64'),
        newPasskey.user_id,
        newPasskey.webauthn_id,
        newPasskey.counter,
        newPasskey.device_type,
        newPasskey.backed_up,
        newPasskey.transport,
      ]
    );
    if (result.rows.length === 0) {
      throw new Error('errors.auth.createPasskey');
    }

    const passkey = PasskeyDAO.convertToPasskey(result.rows[0]);
    await Caching.del(`user:${userId}:passkey`); // Invalidate cache
    await Caching.del(`user:${userId}`); // Invalidate cache
    return passkey;
  }

  static async getPasskeyByCredentialID(credentialID: Passkey['id']): Promise<Passkey | null> {
    const result = await pool.query<PasskeyTable>('SELECT * FROM passkey WHERE webauthn_id = $1', [
      credentialID,
    ]);
    if (result.rows.length === 0) {
      return null;
    }
    const passkey = PasskeyDAO.convertToPasskey(result.rows[0]);
    return passkey;
  }

  static async deletePasskey(userId: User['id']): Promise<void> {
    const result = await pool.query('DELETE FROM passkey WHERE user_id = $1 RETURNING *', [userId]);
    if (result.rowCount === 0) {
      throw new Error('errors.auth.deletePasskey');
    }
    await Caching.del(`user:${userId}:passkey`); // Invalidate cache
    await Caching.del(`user:${userId}`); // Invalidate cache
  }

  static async getUserByCredentialID(credentialID: Passkey['id']): Promise<User | null> {
    const result = await pool.query<PasskeyTable>(
      'SELECT user_id FROM passkey WHERE webauthn_id = $1',
      [credentialID]
    );
    if (result.rows.length === 0) {
      return null;
    }
    const userId = result.rows[0].user_id;
    return UserDAO.getUserById(userId);
  }
}
