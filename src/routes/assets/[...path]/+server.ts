import path from 'node:path';
import type { RequestHandler } from './$types';
// import { PublicationDAO } from '$lib/server/db/publication';
import sharp from 'sharp';
import { existsSync } from 'node:fs';

// This route serves static assets from the assets folder because adding it to the fs allow list only works in development mode
export const GET: RequestHandler = async ({ params, locals }) => {
  // const user = locals.user!;
  const requestPath = params.path;
  const parts = requestPath.split('/');
  try {
    if (parts.length !== 2) {
      throw new Error('Invalid path');
    }
    const [scope, fileName] = parts;
    let pathName = path.resolve('assets', scope, fileName);
    // let hasUserPostedToday = true;
    // if (scope === 'publication') {
    //   hasUserPostedToday = await PublicationDAO.hasUserPostedToday(user.id);
    // }

    const fileExists = existsSync(pathName);
    if (!fileExists) {
      if (scope === 'profile_pictures') {
        pathName = path.resolve('assets', 'defaults', 'user.svg');
      } else {
        throw new Error('File does not exist');
      }
    }
    let file = await sharp(pathName);
    // if (!hasUserPostedToday) {
    //   file = file.blur(7);
    // }
    const buffer = await file.toBuffer();
    const body = new Uint8Array(buffer);
    return new Response(body, {
      status: 200,
    });
  } catch {
    const file = await sharp(path.resolve('assets', 'defaults', 'not_found.svg')).toBuffer();
    const body = new Uint8Array(file);
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
      },
    });
  }
};
