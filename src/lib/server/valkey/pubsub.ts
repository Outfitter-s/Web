import { logger } from '$lib/utils/logger';
import { getValkeyInstance } from '.';

export class PubSub {
  static async publish(channel: string, message: string) {
    const valkey = await getValkeyInstance();
    await valkey.publish(channel, message);
  }

  static async subscribe(channel: string, callback: (message: string) => void) {
    const baseValkey = await getValkeyInstance();
    const valkey = baseValkey.duplicate();
    valkey.subscribe(channel, (err) => {
      if (err) {
        logger.error('Failed to subscribe: %s', err.message);
      }
    });
    valkey.on('message', (c, message) => {
      if (channel === c) callback(message);
    });
    return valkey;
  }
}
