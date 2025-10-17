import pg from 'pg';

const { Pool } = pg;

let pool: pg.Pool;

try {
  pool = new Pool({
    host: process.env.POSTGRES_HOST,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    port: parseInt(process.env.POSTGRES_PORT ?? '', 10) || 5432,
  });
} catch (error) {
  console.error('Failed to create database pool:', error);
  throw error;
}

export default pool;
