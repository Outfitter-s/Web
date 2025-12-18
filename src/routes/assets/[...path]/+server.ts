import path from 'node:path';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PublicationDAO } from '$lib/server/db/publication';
import sharp from 'sharp';
import { existsSync } from 'node:fs';

// const CACHE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// This route serves static assets from the assets folder because adding it to the fs allow list only works in development mode
export const GET: RequestHandler = async ({ params, locals }) => {
  const user = locals.user!;
  const requestPath = params.path;
  const parts = requestPath.split('/');
  try {
    if (parts.length !== 2) {
      throw new Error('Invalid path');
    }
    const [scope, fileName] = parts;
    let pathName = path.resolve('assets', scope, fileName);
    let hasUserPostedToday = true;
    if (scope === 'publication') {
      hasUserPostedToday = await PublicationDAO.hasUserPostedToday(user.id);
    }

    const fileExists = existsSync(pathName);
    if (!fileExists) {
      if (scope === 'profile_pictures') {
        pathName = path.resolve('assets', scope, 'user.png');
      } else {
        throw new Error('File does not exist');
      }
    }
    let file = await sharp(pathName);
    if (!hasUserPostedToday) {
      file = file.blur(7);
    }
    const buffer = await file.toBuffer();
    const body = new Uint8Array(buffer);
    return new Response(body, {
      status: 200,
      // headers: {
      //   'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, immutable`,
      // },
    });
  } catch {
    throw error(404);
  }
};
