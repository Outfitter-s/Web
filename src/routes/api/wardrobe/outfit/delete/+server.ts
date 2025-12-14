import { json } from '@sveltejs/kit';
import z from 'zod';
import { UUID } from '$lib/types';
import { OutfitDAO } from '$lib/server/db/outfit.js';

const schema = z.object({
  outfitId: UUID,
});

export async function DELETE({ locals, request }) {
  const user = locals.user!;
  try {
    const body = await request.json();
    const data = schema.safeParse(body);
    if (!data.success) throw new Error(data.error.issues.map((i) => i.message).join(', '));
    const { outfitId } = data.data;
    await OutfitDAO.outfitBelongsToUser(user.id, outfitId);

    await OutfitDAO.deleteOutfit(outfitId);

    return json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return json({ error: msg }, { status: 500 });
  }
}
