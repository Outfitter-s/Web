import { join } from 'node:path';
import { readdir, readFile } from 'node:fs/promises';
import chalk from 'chalk';
import { TRANSLATIONS_FILES_DIR } from './shared.ts';

const GREEN = chalk.green;
const RED = chalk.red;

export async function loadTranslationMaps() {
  const languages = await readdir(TRANSLATIONS_FILES_DIR);
  const translationMaps = await Promise.all(
    languages.map(async (lang) => {
      const path = join(TRANSLATIONS_FILES_DIR, lang);
      const fileContent = await readFile(path, 'utf-8');
      return { lang, translations: JSON.parse(fileContent), name: lang };
    })
  );

  return translationMaps;
}

export function flattenTranslations(
  translations: Record<string, string>,
  prefix = ''
): Record<string, string> {
  return Object.entries(translations).reduce((acc: Record<string, string>, [key, value]) => {
    if (typeof value === 'object' && value !== null) {
      return {
        ...acc,
        ...flattenTranslations(value, `${prefix}${key}.`),
      };
    }
    acc[`${prefix}${key}`] = value;
    return acc;
  }, {});
}

async function checkTranslations() {
  const hasErrors: { type: string; file: string; message: string }[] = [];

  const translations = await loadTranslationMaps();

  // Check for missing keys
  const flattenedTranslationsLanguages = translations.reduce<Record<string, string[]>>(
    (acc, translation, index) => {
      const fileName = translations[index].name.replace('.json', '');
      const flattened = flattenTranslations(translation);
      Object.keys(flattened).forEach((key) => {
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(fileName);
      });
      return acc;
    },
    {}
  );

  for (const [key, files] of Object.entries(flattenedTranslationsLanguages)) {
    if (files.length < translations.length) {
      const filesMissing = translations.filter(
        (file) => !files.includes(file.name.replace('.json', ''))
      );
      hasErrors.push({
        type: 'Missing key',
        file: filesMissing.map((f) => f.name).join(', '),
        message: `Key "${chalk.red.bold(key)}" is missing in "${chalk.cyan.bold(filesMissing.map((f) => f.name).join('", "'))}" translation files`,
      });
    }
  }

  return hasErrors;
}

async function main() {
  const missingTranslations = await checkTranslations();
  if (missingTranslations.length === 0) {
    console.log(GREEN('✓') + ' All translations are OK!');
  } else {
    missingTranslations.forEach(({ type, file, message }) => {
      console.log(RED('✖') + ` ${file} has errors:`);
      console.log(type + ': ' + message);
    });
    process.exit(1);
  }
  process.exit(0);
}

main();
