import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ params, parent }) => {
  const { outfitId } = params;
  const data = await parent();

  const outfits = data.outfits;
  const outfit = outfits.find((i) => i.id === outfitId);

  if (!outfit) {
    return error(404, 'errors.clothing.outfit.notFound');
  }

  return { outfit };
}) satisfies PageLoad;
