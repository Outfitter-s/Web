import { HERE } from './shared';
import { join } from 'node:path';
import pool from './db/pool';

const BOOTSTRAP_SCRIPT_LOCATION = join(HERE, '../sql/bootstrap.sql');
const file = await Bun.file(BOOTSTRAP_SCRIPT_LOCATION);
const sql = await file.text();

try {
  for (const request of sql.split(';')) {
    const trimmed = request.trim();
    if (trimmed.length > 0) {
      await pool.query(trimmed);
    }
  }
  console.log('Database bootstrap completed successfully.');
} catch (error) {
  console.error('Error during database bootstrap:', error);
  throw error;
} finally {
  await pool.end();
}
