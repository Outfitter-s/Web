import { getValkeyInstance } from '$lib/server/valkey';

export class Caching {
  static async get<T = unknown>(key: string): Promise<T | null> {
    const valkey = await getValkeyInstance();
    const value = await valkey.get(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  static async set(key: string, value: unknown, { ttl = 3600 }: { ttl?: number } = {}) {
    const valkey = await getValkeyInstance();
    await valkey.set(key, JSON.stringify(value), 'EX', ttl);
  }

  static async del(key: string) {
    const valkey = await getValkeyInstance();
    await valkey.del(key);
  }

  static async clear(startsWith: string) {
    const valkey = await getValkeyInstance();
    const keys = await valkey.keys(startsWith + '*');
    if (keys.length > 0) {
      await valkey.del(keys);
    }
  }

  static async nuke() {
    const valkey = await getValkeyInstance();
    const keys = await valkey.keys('*');
    if (keys.length > 0) {
      await valkey.del(keys);
    }
  }
}
