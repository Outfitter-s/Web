import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { UserDAO } from '$lib/server/db/user';

export const GET: RequestHandler = async ({ url }) => {
  const username = url.searchParams.get('username');
  if (!username) {
    return json({ error: 'Username is required' }, { status: 400 });
  }
  const isUsernameTaken = await UserDAO.userExists(username);

  return json({ taken: isUsernameTaken, error: false });
};
