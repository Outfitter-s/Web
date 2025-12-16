import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SocialDAO } from '$lib/server/db/social';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const query = url.searchParams.get('q') || '';
    const results = await SocialDAO.searchUsers(query);
    return json({ success: true, results });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return json({ error: msg }, { status: 500 });
  }
};
