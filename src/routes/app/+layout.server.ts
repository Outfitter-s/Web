import type { LayoutServerLoad } from './$types';

export const load = (async ({ locals }) => {
  if (!locals?.user) {
    throw new Error('errors.auth.userIsRequired');
  }

  return { user: locals.user };
}) satisfies LayoutServerLoad;
