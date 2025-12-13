import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import i18n from '$lib/i18n';
import { urlStartsWith } from '$lib/utils/';
import { auth } from '$lib/server/auth';
import { logger } from '$lib/utils/logger';
import z from 'zod';
import { getCookiePrefix } from '$lib/server/utils';
import Theming, {
  availableModes,
  availableThemes,
  effectiveModes,
} from '$lib/theming/index.svelte';

const NEED_AUTH_ROUTES: string[] = ['/app', '/api/sse', '/api/wardrobe'];

const authHandler: Handle = async ({ event, resolve }) => {
  const { url, cookies, locals } = event;

  const token =
    cookies.get(getCookiePrefix('token')) ||
    event.request.headers.get('Authorization')?.replace('Bearer ', '') ||
    null;

  // Check if the user is logged in, and if so, retrieve the user data
  if (token) {
    try {
      const user = await auth(token);
      if (user) {
        locals.user = user;
      } else {
        cookies.delete(getCookiePrefix('token'), { path: '/' });
        delete locals?.user;
      }
    } catch (error) {
      logger.error('Error verifying token:', error);
      delete locals.user;
      cookies.delete(getCookiePrefix('token'), { path: '/' });
    }
  }

  if (!locals.user && urlStartsWith(url.pathname, NEED_AUTH_ROUTES)) {
    // If the user is not logged in and tries to access a protected route, redirect to the login page
    redirect(303, '/auth');
  }

  const response = await resolve(event);
  response.headers.set(
    'X-Robots-Tag',
    urlStartsWith(url.pathname, NEED_AUTH_ROUTES) ? 'noindex, nofollow' : 'index, follow'
  );

  return response;
};

export const i18nHandler: Handle = async ({ event, resolve }) => {
  const { request } = event;
  // Get user preferred locale
  const acceptLanguage = request.headers.get('accept-language');
  const userLocales =
    acceptLanguage?.split(',').map((lang) => lang.split(';')[0].trim().slice(0, 2)) || [];

  let locale = userLocales.find((l) => i18n.locales.includes(l as never)) || i18n.defaultLocale;

  // Set default locale if user preferred locale does not match
  if (!i18n.locales.includes(locale as never)) locale = i18n.defaultLocale;

  const localeConfig = i18n.loaders.find((l) => l.locale === locale);

  event.locals.locale = locale ?? i18n.defaultLocale;
  event.locals.i18n = {
    lang: locale,
    dir: localeConfig!.getDir(),
  };

  return resolve(event);
};

const themeHandler: Handle = async ({ event, resolve }) => {
  const themingCookie = event.cookies.get(getCookiePrefix('theming'));
  const themingCookieStruct = z.object({
    mode: z.object({
      mode: z.enum(availableModes),
      effective: z.enum(effectiveModes),
    }),
    theme: z.enum(availableThemes),
  });
  let theme = null;
  let mode = null;
  if (themingCookie) {
    try {
      const parsed = themingCookieStruct.parse(JSON.parse(themingCookie));
      theme = parsed.theme;
      mode = parsed.mode;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      // Invalid cookie, ignore
    }
  }
  if (!theme) {
    theme = availableThemes[0];
  }
  if (!mode) {
    mode = { mode: 'system', effective: 'dark' };
  }
  event.locals.theme = {
    theme: Theming.getTheme(theme),
    mode: {
      mode: Theming.getMode(mode.mode),
      effective: mode.effective,
    },
  };
  return resolve(event);
};

const replaceHandler: Handle = async ({ event, resolve }) => {
  const operations = {
    '%lang%': event.locals.i18n.lang,
    '%dir%': event.locals.i18n.dir || 'ltr',
    '%theme%': event.locals.theme.theme,
    '%mode%': event.locals.theme.mode.effective,
  };
  return resolve(event, {
    transformPageChunk: ({ html }) => {
      let transformed = html;
      for (const [key, value] of Object.entries(operations)) {
        transformed = transformed.replaceAll(key, value);
      }
      return transformed;
    },
  });
};

export const handle = sequence(authHandler, i18nHandler, themeHandler, replaceHandler);
