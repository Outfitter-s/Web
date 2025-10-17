import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals, cookies }) => {
  delete locals.user;
  cookies.delete('token', { path: '/' });

  redirect(302, '/auth/log-in');
}) satisfies PageServerLoad;
