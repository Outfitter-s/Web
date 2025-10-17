import { config } from './config';
import { i18nLogger } from '$lib/utils/logger';
import { readable } from 'svelte/store';

type Required<T> = {
  [P in keyof T]-?: T[P];
};

export type Dir = 'rtl' | 'ltr';

interface Loader {
  locale: string;
  dir?: Dir;
  loader: () => Promise<Record<string, unknown>>;
}

type InternalConfig = Required<Config>;

export interface Config {
  defaultLocale: string;
  loaders: Loader[];
}

export class i18n {
  private _config: InternalConfig;
  private _locale = $state<string>('en');
  private _currentPageTranslations = $state<Record<string, string>>({});
  private _dir = $state<Dir>('ltr');

  constructor(config: Config) {
    this._config = this.normalizeConfig(config);
    this._locale = config.defaultLocale;
    i18nLogger.debug(`i18n initialized with default locale "${config.defaultLocale}"`);
  }

  private normalizeConfig(config: Config): InternalConfig {
    const defaultDir = 'ltr';
    config.loaders.map((loader) => {
      loader.dir ??= defaultDir;
      return loader;
    });

    return config;
  }

  get config() {
    return this._config;
  }

  get locale() {
    return this._locale;
  }

  get locales() {
    return this._config.loaders.map((loader) => loader.locale);
  }

  get defaultLocale() {
    return this._config.defaultLocale;
  }

  get dir() {
    return this._dir;
  }

  setLocale(locale: string, hook?: boolean) {
    if (!locale) {
      return;
    }
    i18nLogger.debug(`Setting locale to "${locale}"`);
    if (this.isLocaleSupported(locale)) {
      this.loadTranslations(locale);
      if (locale !== this._locale) {
        this._locale = locale;
        this._dir = config.loaders.find((l) => l.locale === locale)?.dir as Dir;
      }
    } else {
      i18nLogger.error(`Locale ${locale} not supported`);
      throw new Error(`Locale ${locale} not supported`);
    }

    if (hook) {
      return;
    }

    // First delete the old locale cookie
    document.cookie = `locale=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    // Then set the new locale cookie
    document.cookie = `locale=${locale}; path=/; max-age=31536000`;
  }

  private isLocaleSupported(locale: string): boolean {
    return this.locales.includes(locale);
  }

  // Take a deeply nested object and flatten it into a single level object with dot notation
  private flattenTranslations(
    translations: Record<string, unknown>,
    prefix = ''
  ): Record<string, string> {
    return Object.entries(translations).reduce(
      (acc, [key, value]) => {
        if (typeof value === 'object' && value !== null) {
          return {
            ...acc,
            ...this.flattenTranslations(value as Record<string, unknown>, `${prefix}${key}.`),
          };
        }
        acc[`${prefix}${key}`] = value as string;
        return acc;
      },
      {} as Record<string, string>
    );
  }

  // Load translations for the current locale in memory
  async loadTranslations(locale: string) {
    if (locale === this._locale && Object.keys(this._currentPageTranslations).length !== 0) return;
    const loader = this._config.loaders.find((l) => l.locale === locale);
    if (loader) {
      this._currentPageTranslations = this.flattenTranslations(await loader.loader());
    } else {
      i18nLogger.error(`Loader for locale ${locale} not found`);
      throw new Error(`Loader for locale ${locale} not found`);
    }

    i18nLogger.debug(
      `${Object.keys(this._currentPageTranslations).length} "${locale}" translations loaded`
    );
  }

  // Get the translations for the current page
  get translations() {
    return this._currentPageTranslations;
  }

  // Main client entrypoint to get a single translation.
  // Updates when the locale changes
  get t() {
    return readable((key: string, params?: Record<string, unknown>) => {
      if (Object.keys(this._currentPageTranslations).length === 0) {
        return key;
      }
      const translation = this._currentPageTranslations[key];
      if (translation) {
        return translation.replace(/\{{([a-zA-Z0-9]+)\}}/g, (_, index) =>
          String(params?.[index] || '')
        );
      } else {
        i18nLogger.warn(`Translation for key "${key}" not found`);
      }
      return key;
    });
  }
}
