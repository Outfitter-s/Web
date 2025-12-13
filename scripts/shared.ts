import { join } from 'node:path';

export const HERE = import.meta.url.startsWith('file:')
  ? new URL('.', import.meta.url).pathname
  : process.cwd();
export const DOWNLOAD_PATH = join(HERE, '../static/assets/');
export const TRANSLATIONS_FILES_DIR = join(HERE, '../src/lib/i18n/messages');
