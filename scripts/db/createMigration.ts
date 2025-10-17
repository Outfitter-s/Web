import { HERE } from '../shared.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

async function main() {
  const now = new Date().getTime();
  const migrationsPath = join(HERE, `../sql/migrations`);
  const fileName = `migration.${now}.sql`;
  const sql = `-- Migration created at ${new Date(now).toISOString()}\n\n`;

  await mkdir(migrationsPath, { recursive: true });
  const filePath = join(migrationsPath, fileName);
  await writeFile(filePath, sql);
}

main();
