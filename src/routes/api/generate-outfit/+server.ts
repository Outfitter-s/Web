import { json } from '@sveltejs/kit';
import { generateOutfit } from '$lib/server/db/generateOutfit';

export async function POST({ locals }) {
  if (!locals.user) return json({ error: 'Not authenticated' }, { status: 401 });
  const outfit = await generateOutfit(locals.user.id);
  return json(outfit);
}
