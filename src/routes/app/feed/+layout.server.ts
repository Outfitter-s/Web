import { PublicationDAO } from '$lib/server/db/publication';
import type { LayoutServerLoad } from './$types';

export const load = (async () => {
  const publications = await PublicationDAO.getAllPublication();

  return {
    publications,
  };
}) satisfies LayoutServerLoad;
