import { config as internalConfig } from './config';
import { i18n as i18nClass } from './i18n.svelte';

const i18n = new i18nClass(internalConfig);

export default i18n;
