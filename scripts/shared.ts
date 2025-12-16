import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HERE = import.meta.url.startsWith('file:')
  ? dirname(fileURLToPath(import.meta.url))
  : process.cwd();
export const DOWNLOAD_PATH = join(HERE, '../static/assets/');
export const TRANSLATIONS_FILES_DIR = join(HERE, '../src/lib/i18n/messages');
