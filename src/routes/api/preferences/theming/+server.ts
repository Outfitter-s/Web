import { env } from '$env/dynamic/private';
import { getCookiePrefix } from '$lib/server/utils';
import type { Mode, EffectiveMode, Theme } from '$lib/theming/index.svelte';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const { mode, theme } = (await request.json()) as {
    mode: { mode: Mode; effective: EffectiveMode };
    theme: Theme;
  };

  cookies.set(getCookiePrefix('theming'), JSON.stringify({ mode, theme }), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365,
  });

  return new Response(null, {
    status: 200,
  });
};
