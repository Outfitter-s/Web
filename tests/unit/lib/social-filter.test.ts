import { describe, it, expect } from 'vitest';
import { filterText } from '$lib/server/socialFilter';

describe('socialFilter.filterText', () => {
  it("To not censor lorem-ipsum since it's not bad content", () => {
    const sentence =
      'lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
    expect(filterText(sentence)).toBe(sentence);
  });

  it('Censors bad words in the content', () => {
    const sentence = 'This is some bad content with fuck and hell words.';
    const censored = 'This is some bad content with **** and **** words.';
    expect(filterText(sentence)).toBe(censored);
  });

  it('To not censor bad words contained in a regular word', () => {
    const sentence = 'The American constitution';
    expect(filterText(sentence)).toBe(sentence);
  });
});
