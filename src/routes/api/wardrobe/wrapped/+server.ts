import type { RequestHandler } from './$types';
import { logger } from '$lib/utils/logger';
import { json } from '@sveltejs/kit';
import { WrappedDAO } from '$lib/server/db/wrapped';

export const GET: RequestHandler = async ({ locals }) => {
  try {
    const user = locals.user!;
    const wrapped = await WrappedDAO.getWrapped(user.id);
    return json({ success: true, wrapped });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('Error loading wrapped :', msg);
    return json(
      {
        message: msg || 'errors.server.connectionRefused',
      },
      { status: 400 }
    );
  }
};
