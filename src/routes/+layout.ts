import i18n from '$lib/i18n';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data }) => {
  const { i18n: i18nData } = data;

  await i18n.setLocale(i18nData.lang, true);

  return data;
};
