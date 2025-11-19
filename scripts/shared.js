import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
export const HERE = dirname(__filename);

export const DOWNLOAD_PATH = join(HERE, '../static/assets/');
export const TRANSLATIONS_FILES_DIR = join(HERE, '../src/lib/i18n/messages');
