import { ICSTokenDAO } from '$lib/server/db/ICSToken';
import { OutfitDAO } from '$lib/server/db/outfit';
import { getEnv } from '$lib/server/utils';
import type { Outfit } from '$lib/types';
import type { RequestHandler } from './$types';
import { i18n } from '$lib/i18n/i18n.svelte';
import { config as i18nConfig } from '$lib/i18n/config';

interface Event {
  date: Date;
  url: string;
}

class ICS {
  #events: Event[] = [];
  constructor(private i18n: i18n) {}

  addEvent(event: Event) {
    this.#events.push(event);
  }

  toString() {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      `PRODID:-//Outfitter//${this.i18n.locale}`,
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    for (const event of this.#events) {
      lines.push(
        'BEGIN:VEVENT',
        `UID:${event.date.toISOString()}@outfitter.paillaugue.fr`,
        `DTSTAMP:${this.formatDate(new Date())}`,
        `DTSTART;VALUE=DATE:${this.formatDate(event.date)}`,
        `SUMMARY:${this.i18n.t('ics.event.title', { date: event.date.toDateString() })}`,
        `DESCRIPTION:${this.i18n.t('ics.event.description', { url: event.url })}`,
        'END:VEVENT'
      );
    }

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  formatDate(date: Date) {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }
}

export const GET: RequestHandler = async ({ url }) => {
  const origin = getEnv('ORIGIN', 'http://localhost:5173');
  const getOutfitURL = (outfitId: Outfit['id']) => {
    return `${origin}/app/wardrobe/outfit/${outfitId}`;
  };
  try {
    const params = url.searchParams;
    const token = params.get('token');
    let locale = params.get('locale') || 'en';
    if (!token) throw new Error('An authentication token is required');
    const tokenRow = await ICSTokenDAO.getFromToken(token);
    if (!tokenRow) throw new Error('Invalid authentication token');
    const outfits = await OutfitDAO.getAllUserOutfits(tokenRow.userId);
    const i18nInstance = new i18n(i18nConfig);
    if (!i18nInstance.isLocaleSupported(locale)) {
      locale = i18nInstance.defaultLocale;
    }
    i18nInstance.setLocale(locale, true);
    const cal = new ICS(i18nInstance);
    // Wait for translations to be ready before building events, I know this is weird
    await new Promise((resolve) => setTimeout(resolve, 0));
    for (const outfit of outfits) {
      const event: Event = {
        date: outfit.createdAt,
        url: getOutfitURL(outfit.id),
      };
      cal.addEvent(event);
    }
    const calStr = cal.toString();

    return new Response(calStr);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(msg, { status: 400 });
  }
};
