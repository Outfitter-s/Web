import { json } from '@sveltejs/kit';
import z from 'zod';
import { OutfitPreviewZ, OutfitZ } from '$lib/types';
import { OutfitDAO } from '$lib/server/db/outfit';

const schema = z.object({
  outfit: OutfitPreviewZ.extend({
    createdAt: OutfitZ.shape.createdAt.optional().default(new Date()),
  }),
});

export async function POST({ locals, request }) {
  const user = locals.user!;
  try {
    const body = await request.json();
    const data = schema.safeParse(body);
    if (!data.success) throw new Error(data.error.issues.map((i) => i.message).join(', '));
    const { outfit } = data.data;
    const newOutfit = await OutfitDAO.createOutfit(user.id, outfit);

    return json({ success: true, id: newOutfit.id });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return json({ error: msg }, { status: 500 });
  }
}
