import { loadTranslations } from '$lib/i18n';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  const { i18n } = locals;

  if (i18n.lang) await loadTranslations(i18n.lang);

  return { ...locals };
};
