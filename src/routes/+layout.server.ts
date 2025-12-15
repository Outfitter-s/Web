import i18n from '$lib/i18n';
import { getChangelog } from '$lib/server/changelog';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  const { i18n: i18nData } = locals;

  if (i18nData.lang) await i18n.loadTranslations(i18nData.lang);

  const release = await getChangelog();

  return { ...locals, release };
};
