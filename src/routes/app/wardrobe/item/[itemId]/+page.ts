import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ params, parent }) => {
  const { itemId } = params;
  const data = await parent();

  const items = data.items;
  const item = items.find((i) => i.id === itemId);

  if (!item) {
    return error(404, 'errors.clothing.item.notFound');
  }

  return { item };
}) satisfies PageLoad;
