import { env } from '$env/dynamic/private';
import { logger } from '$lib/utils/logger';
import Valkey from 'iovalkey';

let client: Valkey | null = null;
let connectionPromise: Promise<Valkey> | null = null;

async function getValkeyInstance(): Promise<Valkey> {
  if (client) {
    return client;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  // Set the promise immediately to prevent race conditions
  connectionPromise = (async () => {
    try {
      client = new Valkey(
        env.VALKEY_PORT ? parseInt(env.VALKEY_PORT, 10) : 6379,
        env.VALKEY_HOST || 'localhost'
      );
      // Wait for the connection to be ready
      await new Promise<void>((resolve, reject) => {
        const onReady = () => {
          client?.removeListener('error', onError);
          resolve();
        };
        const onError = (err: Error) => {
          client?.removeListener('ready', onReady);
          reject(err);
        };
        client!.once('ready', onReady);
        client!.once('error', onError);
      });
      return client;
    } catch (error) {
      // Clear the promise on error so retries can happen
      connectionPromise = null;
      client = null;
      logger.error('Failed to connect to Valkey:', error);
      throw error;
    }
  })();

  return connectionPromise;
}

export { getValkeyInstance };
