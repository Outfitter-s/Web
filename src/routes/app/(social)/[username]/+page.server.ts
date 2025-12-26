import { UserDAO } from '$lib/server/db/user';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { SocialDAO } from '$lib/server/db/social';

export const load = (async ({ params }) => {
  const { username } = params;
  try {
    const pageUser = await UserDAO.getUserByUsername(username.slice(1));
    delete pageUser.passwordHash;
    const nbFollowers = await SocialDAO.getNbFollowers(pageUser.id);
    return { pageUser, nbFollowers };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return error(404, msg);
  }
}) satisfies PageServerLoad;
