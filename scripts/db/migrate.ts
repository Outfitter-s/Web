// ---------------------------------------------------------
// --  This file is made to execute database migrations.  --
// --  It reads SQL files from the migrations directory   --
// --  and applies them to the database if they have not  --
// --  already been done.                                 --
// ---------------------------------------------------------

import pool from './pool.ts';
import { HERE } from '../shared.ts';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const getLastMigrationDate = async (): Promise<Date> => {
  const { rows } = await pool.query<{ created_at: string }>(
    'SELECT created_at FROM migrations ORDER BY created_at DESC LIMIT 1'
  );
  return rows.length > 0 ? new Date(rows[0].created_at) : new Date(0);
};

const setLastMigrationDate = async (date: Date): Promise<void> => {
  await pool.query('INSERT INTO migrations (name, created_at) VALUES ($1, $2)', [
    'last_migration',
    date.toISOString(),
  ]);
};

async function applyMigration(name: string) {
  const migrationPath = join(HERE, `../sql/migrations/${name}`);
  const sql = await readFile(migrationPath, 'utf8');
  if (!sql) {
    throw new Error(`Migration file ${name} not found.`);
  }
  const migrationSQL = await pool.query(sql);
  // Update migrations table
  await pool.query('INSERT INTO migrations (name, created_at) VALUES ($1, NOW())', [name]);
  console.log(`Migration ${name} applied successfully.`);
  return migrationSQL;
}

const lastMigrationDate = await getLastMigrationDate();
if (lastMigrationDate) {
  console.log(`Last migration: ${lastMigrationDate}`);
} else {
  console.log('No previous migrations found.');
}

const availableMigrations = (await readdir(join(HERE, '../sql/migrations'))).filter((f) =>
  f.match(/migration\.(\d+)\.sql/)
);
const newMigrations = availableMigrations.filter((file) => {
  const timeStamp = file.match(/migration\.(\d+)\.sql/);
  if (!timeStamp) return false;
  const migrationTime = new Date(parseInt(timeStamp[1], 10));
  return !lastMigrationDate || migrationTime > lastMigrationDate;
});
console.log(`Available migrations: ${availableMigrations.length}`);
console.log(`New migrations to apply: ${newMigrations.length}`);

for (const migration of newMigrations) {
  try {
    await applyMigration(migration);
  } catch (error) {
    console.error(`Failed to apply migration ${migration}:`, error);
    process.exit(1);
  }
}

await setLastMigrationDate(new Date());
process.exit(0);
