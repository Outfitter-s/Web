import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { defaultLocale, config as i18nConfig, locales } from '$lib/i18n';
import { urlStartsWith } from '$lib/utils/';
import { auth } from '$lib/server/auth';
import { logger } from '$lib/utils/logger';

const NEED_AUTH_ROUTES: string[] = ['/app'];

const authHandler: Handle = async ({ event, resolve }) => {
  const { url, cookies, locals } = event;

  const token =
    cookies.get('token') ||
    event.request.headers.get('Authorization')?.replace('Bearer ', '') ||
    null;

  // Check if the user is logged in, and if so, retrieve the user data
  if (token) {
    try {
      const user = await auth(token);
      if (user) {
        locals.user = user;
      } else {
        cookies.delete('token', { path: '/' });
        delete locals?.user;
      }
    } catch (error) {
      logger.error('Error verifying token:', error);
      delete locals.user;
      cookies.delete('token', { path: '/' });
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
  const { request, cookies } = event;

  let locale = cookies.get('locale');

  if (!locale) {
    // Get user preferred locale
    locale = `${`${request.headers.get('accept-language')}`.match(/^[a-z]{2}/i)}`.toLowerCase();

    // Set default locale if user preferred locale does not match
    if (!locales.includes(locale)) locale = defaultLocale;
  }

  const localeConfig = i18nConfig.loaders.find((l) => l.locale === locale);

  event.locals.i18n = {
    lang: locale,
    dir: localeConfig!.dir || 'ltr',
  };

  return resolve(event, {
    transformPageChunk: ({ html }) =>
      html.replace('%lang%', locale).replace('%dir%', localeConfig!.dir || 'ltr'),
  });
};

export const handle = sequence(authHandler, i18nHandler);
