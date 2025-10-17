import { createClient } from 'redis';
import { env } from '$env/dynamic/private';
import { logger } from '$lib/utils/logger';

export class Redis {
  private static client: ReturnType<typeof createClient> | null = null;
  private static enabled = true;

  static async getClient() {
    if (!this.client) {
      this.client = await createClient({
        socket: {
          host: env.REDIS_HOST || 'localhost',
          port: env.REDIS_PORT ? parseInt(env.REDIS_PORT, 10) : 6379,
        },
      })
        .on('error', (err) => logger.error('Redis Client Error', err))
        .connect();
    }
    return this.client;
  }

  static async get<T = unknown>(key: string): Promise<T | null> {
    if (!this.enabled) {
      return null;
    }
    const client = await this.getClient();
    const value = await client.get(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  static async set(
    key: string,
    value: unknown,
    { ttl = 3600, condition = 'NX' }: { ttl?: number; condition?: 'NX' | 'XX' } = {}
  ) {
    if (!this.enabled) {
      return;
    }
    const client = await this.getClient();
    await client.set(key, JSON.stringify(value), {
      expiration: {
        type: 'EX',
        value: ttl,
      },
      condition: condition, // Only set if the key does not already exist
    });
  }

  static async del(key: string) {
    if (!this.enabled) {
      return;
    }
    const client = await this.getClient();
    await client.del(key);
  }

  static async clear(startsWith: string) {
    const client = await this.getClient();
    const keys = await client.keys(startsWith + '*');
    if (keys.length > 0) {
      await client.del(keys);
    }
  }

  static async nuke() {
    const client = await this.getClient();
    const keys = await client.keys('*');
    if (keys.length > 0) {
      await client.del(keys);
    }
  }
}
