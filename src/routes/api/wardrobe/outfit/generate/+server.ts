import { json } from '@sveltejs/kit';
import { generateOutfits } from '$lib/server/db/generateOutfit';
import z from 'zod';
import { CLOTHING_STYLES, WeatherZ } from '$lib/types';
import { logger } from '$lib/utils/logger';

const schema = z.object({
  count: z.number().min(1).max(10).default(1),
  weather: WeatherZ,
  style: z.enum(CLOTHING_STYLES).default(CLOTHING_STYLES[0]),
});

export async function POST({ locals, request }) {
  const user = locals.user!;
  try {
    const body = await request.json();
    const data = schema.safeParse(body);
    if (!data.success) throw new Error(data.error.issues.map((i) => i.path[0]).join(', '));
    const { count, weather, style } = data.data;

    const outfits = await generateOutfits(user.id, weather, count, { style });
    return json(outfits);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`Error generating outfits for user ${user.id}: ${msg}`);
    return json({ error: msg }, { status: 500 });
  }
}
