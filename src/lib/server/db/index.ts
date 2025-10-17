import { env } from '$env/dynamic/private';
import { logger } from '$lib/utils/logger';
import pg from 'pg';

const { Pool } = pg;

let pool: pg.Pool;

try {
  pool = new Pool({
    host: env.POSTGRES_HOST,
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    database: env.POSTGRES_DB,
    port: parseInt(env.POSTGRES_PORT ?? '', 10) || 5432,
  });
} catch (error) {
  logger.error('Failed to create database pool:', error);
  throw error;
}

export default pool;
