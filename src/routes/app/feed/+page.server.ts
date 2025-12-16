import { PublicationDAO } from '$lib/server/db/publication';
import type { Publication } from '$lib/types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const publications: Publication[] = await PublicationDAO.getAllPublication();

  return {
    publications: publications,
  };
};
