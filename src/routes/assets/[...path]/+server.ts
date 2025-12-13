import path from 'node:path';
import fs from 'node:fs/promises';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// This route serves static assets from the assets folder because adding it to the fs allow list only works in development mode
export const GET: RequestHandler = async ({ params }) => {
  const parts = params.path.split('/');
  if (parts.length !== 2) throw error(404);
  const allowedDirs = ['clothing_item', 'outfits'];
  if (!allowedDirs.includes(parts[0])) throw error(404);
  const pathName = path.resolve('assets', params.path);

  try {
    const file = await fs.readFile(pathName);
    return new Response(file);
  } catch {
    throw error(404);
  }
};
