import type { Passkey, User, UUID } from '$lib/types';
import pool from '.';
import { Caching } from './caching';
import { PasskeyDAO } from './passkey';
import { SocialDAO } from './social';
import { writeFile } from 'node:fs/promises';

export interface UserTable {
  id: UUID;
  username: string;
  email: string;
  password_hash: string;
  created_at: Date;
  totp_secret: string;
}
export class UserDAO {
  static convertToUser(
    row: UserTable,
    passkey: Passkey | null = null,
    following: User['following'] = []
  ): User {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      passwordHash: row.password_hash,
      createdAt: row.created_at,
      passkey: passkey,
      totpSecret: row.totp_secret,
      following,
    };
  }

  static async createUser(
    username: User['username'],
    email: User['email'],
    passwordHash: Required<User>['passwordHash']
  ): Promise<User> {
    if (await UserDAO.userExists(username)) {
      throw new Error('errors.auth.usernameTaken');
    }
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [username, email, passwordHash]
    );
    if (result.rows.length === 0) {
      throw new Error('errors.auth.createUser');
    }
    return UserDAO.convertToUser(result.rows[0]);
  }

  static async userExists(username: User['username']): Promise<boolean> {
    const cachedValue = await Caching.get<boolean>(`userExists:${username}`);
    if (cachedValue) return cachedValue;
    const result = await pool.query('SELECT 1 FROM users WHERE username = $1', [username]);
    const exists = result.rows.length > 0;
    await Caching.set(`userExists:${username}`, exists);
    return exists;
  }

  static async isEmailTaken(email: User['email']) {
    const cachedValue = await Caching.get<boolean>(`emailTaken:${email}`);
    if (cachedValue) return cachedValue;
    const result = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    const taken = result.rows.length > 0;
    await Caching.set(`emailTaken:${email}`, taken);
    return taken;
  }

  static async getUserById(id: User['id']): Promise<User> {
    const cachedUser = await Caching.get<User>(`user:${id}`);
    if (cachedUser) return cachedUser;

    const userResult = await pool.query<UserTable>('SELECT * FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      throw new Error('errors.auth.userNotFound');
    }
    const user = UserDAO.convertToUser(
      userResult.rows[0],
      await PasskeyDAO.getUserPasskey(userResult.rows[0].id),
      await SocialDAO.getFollowingIds(id)
    );
    await Caching.set(`user:${user.id}`, user);
    return user;
  }

  static async getUserByUsername(username: User['username']): Promise<User> {
    const userResult = await pool.query<UserTable>('SELECT * FROM users WHERE username = $1', [
      username,
    ]);
    if (userResult.rows.length === 0) {
      throw new Error('errors.auth.badUsername');
    }
    const user = UserDAO.convertToUser(
      userResult.rows[0],
      await PasskeyDAO.getUserPasskey(userResult.rows[0].id),
      await SocialDAO.getFollowingIds(userResult.rows[0].id)
    );
    return user;
  }

  static async getUserByEmail(email: User['email']): Promise<User> {
    const userResult = await pool.query<UserTable>('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      throw new Error('errors.auth.userNotFound');
    }
    const user = userResult.rows[0];
    return UserDAO.convertToUser(
      userResult.rows[0],
      await PasskeyDAO.getUserPasskey(user.id),
      await SocialDAO.getFollowingIds(user.id)
    );
  }

  static async credentialsExists(username: User['username'], email: User['email']) {
    const result = await pool.query<{ username: string; email: string }>(
      'SELECT username, email FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    if (result.rows.length !== 0) {
      const row = result.rows[0];
      const isUsernameTaken = row.username === username;
      if (isUsernameTaken) throw new Error('errors.auth.usernameTaken');
      throw new Error('errors.auth.emailInUse');
    }

    return false;
  }

  static async setTOTPSecret(userId: User['id'], secret: string): Promise<void> {
    const result = await pool.query('UPDATE users SET totp_secret = $1 WHERE id = $2', [
      secret,
      userId,
    ]);
    if (result.rowCount === 0) {
      throw new Error('errors.auth.setTOTPSecret');
    }
    await Caching.del(`user:${userId}`);
  }

  static async unlinkTOTP(userId: User['id']): Promise<void> {
    const result = await pool.query('UPDATE users SET totp_secret = NULL WHERE id = $1', [userId]);
    if (result.rowCount === 0) {
      throw new Error('errors.auth.unlinkTOTP');
    }
    await Caching.del(`user:${userId}`);
  }

  static async requestPasswordReset(email: User['email']): Promise<string> {
    const exists = await UserDAO.isEmailTaken(email);
    if (!exists) throw new Error('errors.auth.passwordReset.noAccountWithEmail');
    const id = crypto.randomUUID();
    await Caching.set(`passwordReset:${id}`, email, { ttl: 60 * 5 }); // 5 min expiry

    return id;
  }

  static async updateUser(
    id: User['id'],
    updates: Partial<{
      username: User['username'];
      passwordHash: User['passwordHash'];
      email: User['email'];
    }>
  ): Promise<void> {
    const fields = Object.keys(updates);
    if (fields.length === 0) return;
    const fieldsMap = {
      username: 'username',
      passwordHash: 'password_hash',
      email: 'email',
    };
    const mappedFields = fields.map((field) => {
      if (!(field in fieldsMap)) {
        throw new Error(`Invalid field: ${field}`);
      }
      return fieldsMap[field as keyof typeof fieldsMap];
    });

    const values = Object.values(updates);
    const setString = mappedFields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const result = await pool.query(
      `UPDATE users SET ${setString} WHERE id = $${fields.length + 1}`,
      [...values, id]
    );
    if (result.rowCount === 0) {
      throw new Error('errors.auth.updateUser');
    }
    await Caching.del(`user:${id}`);
    await Caching.del(`userExists:${updates.username}`);
  }

  static async updateProfilePicture(userId: User['id'], imageBuffer: Buffer): Promise<void> {
    const outputPath = 'assets/profile_pictures/' + String(userId) + '.png';
    await writeFile(outputPath, imageBuffer);
  }
}
