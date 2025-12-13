import { json } from '@sveltejs/kit';
import { generateOutfits } from '$lib/server/db/generateOutfit';
import z from 'zod';
import { WeatherZ } from '$lib/types.js';

const schema = z.object({
  count: z.number().min(1).max(10).default(1),
  weather: WeatherZ,
});

export async function POST({ locals, request }) {
  const user = locals.user!;
  try {
    const body = await request.json();
    const data = schema.safeParse(body);
    if (!data.success) throw new Error(data.error.issues.map((i) => i.path[0]).join(', '));
    const { count, weather } = data.data;

    const outfits = await generateOutfits(user.id, weather, count);
    return json(outfits);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return json({ error: msg }, { status: 500 });
  }
}
