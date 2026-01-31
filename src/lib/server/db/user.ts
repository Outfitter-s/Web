import type { Passkey, User, UUID } from '$lib/types';
import { sql } from 'bun';
import { Caching } from './caching';
import { PasskeyDAO } from './passkey';
import { SocialDAO } from './social';
import { unlink, writeFile } from 'node:fs/promises';

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
    const rows = await sql<
      UserTable[]
    >`INSERT INTO users (username, email, password_hash) VALUES (${username}, ${email}, ${passwordHash}) RETURNING *`;
    if (rows.length === 0) {
      throw new Error('errors.auth.createUser');
    }
    return UserDAO.convertToUser(rows[0]);
  }

  static async userExists(username: User['username']): Promise<boolean> {
    const cachedValue = await Caching.get<boolean>(`userExists:${username}`);
    if (cachedValue) return cachedValue;
    const rows = await sql`SELECT 1 FROM users WHERE username = ${username}`;
    const exists = rows.length > 0;
    await Caching.set(`userExists:${username}`, exists);
    return exists;
  }

  static async isEmailTaken(email: User['email']) {
    const cachedValue = await Caching.get<boolean>(`emailTaken:${email}`);
    if (cachedValue) return cachedValue;
    const rows = await sql`SELECT 1 FROM users WHERE email = ${email}`;
    const taken = rows.length > 0;
    await Caching.set(`emailTaken:${email}`, taken);
    return taken;
  }

  static async getUserById(id: User['id']): Promise<User> {
    const cachedUser = await Caching.get<User>(`user:${id}`);
    if (cachedUser) return cachedUser;

    const rows = await sql<UserTable[]>`SELECT * FROM users WHERE id = ${id}`;
    if (rows.length === 0) {
      throw new Error('errors.auth.userNotFound');
    }
    const user = UserDAO.convertToUser(
      rows[0],
      await PasskeyDAO.getUserPasskey(rows[0].id),
      await SocialDAO.getFollowingIds(id)
    );
    await Caching.set(`user:${user.id}`, user);
    return user;
  }

  static async getUserByUsername(username: User['username']): Promise<User | null> {
    const rows = await sql<UserTable[]>`SELECT * FROM users WHERE username = ${username}`;
    if (rows.length === 0) {
      return null;
    }
    const user = UserDAO.convertToUser(
      rows[0],
      await PasskeyDAO.getUserPasskey(rows[0].id),
      await SocialDAO.getFollowingIds(rows[0].id)
    );
    return user;
  }

  static async getUserByEmail(email: User['email']): Promise<User> {
    const rows = await sql<UserTable[]>`SELECT * FROM users WHERE email = ${email}`;
    if (rows.length === 0) {
      throw new Error('errors.auth.userNotFound');
    }
    const user = rows[0];
    return UserDAO.convertToUser(
      rows[0],
      await PasskeyDAO.getUserPasskey(user.id),
      await SocialDAO.getFollowingIds(user.id)
    );
  }

  static async credentialsExists(username: User['username'], email: User['email']) {
    const rows = await sql<
      { username: string; email: string }[]
    >`SELECT username, email FROM users WHERE username = ${username} OR email = ${email}`;
    if (rows.length !== 0) {
      const row = rows[0];
      const isUsernameTaken = row.username === username;
      if (isUsernameTaken) throw new Error('errors.auth.usernameTaken');
      throw new Error('errors.auth.emailInUse');
    }

    return false;
  }

  static async setTOTPSecret(userId: User['id'], secret: string): Promise<void> {
    const result = await sql`UPDATE users SET totp_secret = ${secret} WHERE id = ${userId};`;
    if (result.affectedRows === 0) {
      throw new Error('errors.auth.setTOTPSecret');
    }
    await Caching.del(`user:${userId}`);
  }

  static async unlinkTOTP(userId: User['id']): Promise<void> {
    const result = await sql`UPDATE users SET totp_secret = NULL WHERE id = ${userId}`;
    if (result.affectedRows === 0) {
      throw new Error('errors.auth.unlinkTOTP');
    }
    await Caching.del(`user:${userId}`);
  }

  static async requestPasswordReset(email: User['email']): Promise<string> {
    const exists = await UserDAO.isEmailTaken(email);
    if (!exists) throw new Error('errors.auth.passwordReset.noAccountWithEmail');
    const id = crypto.randomUUID();
    await Caching.set(`passwordReset:${id}`, email, { ttl: 60 * 60 * 5 }); // 5 min expiry

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
    const result = await sql.unsafe(
      `UPDATE users SET ${setString} WHERE id = $${fields.length + 1}`,
      [...values, id]
    );
    if (result.affectedRows === 0) {
      throw new Error('errors.auth.updateUser');
    }
    await Caching.del(`user:${id}`);
    await Caching.del(`userExists:${updates.username}`);
  }

  static async updateProfilePicture(userId: User['id'], imageBuffer: Buffer): Promise<void> {
    const outputPath = 'assets/profile_pictures/' + String(userId) + '.png';
    try {
      await unlink(outputPath);
    } catch {
      /* empty */
    } finally {
      await writeFile(outputPath, imageBuffer);
    }
  }
}
