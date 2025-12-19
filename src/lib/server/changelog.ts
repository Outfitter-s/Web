import { Caching } from './db/caching';
import { readFile } from 'node:fs/promises';

const CACHE_DURATION = 60 * 10; // 10 minutes

export type Version = `${number}.${number}.${number}`;

export async function getChangelog(): Promise<Version> {
  // const cached = await Caching.get<Version>('version_latest');
  // if (cached) {
  //   return cached;
  // }
  const filePath = new URL('../../../VERSION', import.meta.url);
  const content = await readFile(filePath, 'utf-8');
  const data = content.trim() as Version;
  // await Caching.set('version_latest', data, { ttl: CACHE_DURATION });

  return data;
}
