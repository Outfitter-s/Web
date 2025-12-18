import BAD_WORDS from './badWords.json';

interface CensorshipOptions {
  censorCharacter?: string;
  censorPartialWords?: boolean;
}
const pattern = BAD_WORDS.map((word) => word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')) // Escape special regex characters
  .join('|');

export function filterText(
  content: string,
  { censorCharacter = '*', censorPartialWords = false }: CensorshipOptions = {}
): string {
  // This function has for only goal : to remove and censor inappropriate content inside posts.
  const censorWord = (word: string): string => {
    return censorCharacter.repeat(word.length);
  };

  const wordBoundary = censorPartialWords ? '' : '\\b';
  const regex = new RegExp(`${wordBoundary}(${pattern})${wordBoundary}`, 'gi');

  return content.replace(regex, (matched) => censorWord(matched));
}
