import { setLocale } from '$lib/i18n';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data }) => {
  const { i18n } = data;

  await setLocale(i18n.lang, true);

  return data;
};
