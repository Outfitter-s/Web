import { describe, it, expect } from 'vitest';
import { patternScore } from '$lib/server/db/outfitStrategies/pattern';
import { lastWornScore } from '$lib/server/db/outfitStrategies/lastWorn';
import { monochromeScore } from '$lib/server/db/outfitStrategies/monochrome';
import type { ScoredClothingItem } from '$lib/types';

const mockItem = (
  pattern?: string,
  color?: string,
  lastWornAt?: Date | null
): ScoredClothingItem => ({
  id: '1',
  imageUrl: 'https://example.com/image.jpg',
  type: 'shirt',
  color: (color || 'red') as any,
  pattern: (pattern || 'solid') as any,
  createdAt: new Date(),
  name: 'Test Item',
  description: null,
  lastWornAt: lastWornAt ?? null,
  userId: '123',
  score: 0,
});

describe('Lifestyle-based scoring strategies', () => {
  describe('patternScore', () => {
    it('returns 0 when base pattern is missing', () => {
      const base = { ...mockItem(), pattern: undefined } as any;
      const compare = mockItem('striped');
      expect(patternScore(base, compare)).toBe(0);
    });

    it('returns high score for matching patterns', () => {
      const base = mockItem('striped');
      const compare = mockItem('striped');
      const score = patternScore(base, compare);
      expect(score).toBeGreaterThan(0.7);
    });

    it('returns high score for solid with any pattern (versatility)', () => {
      const base = mockItem('solid');
      const compare = mockItem('floral');
      const score = patternScore(base, compare);
      expect(score).toBeGreaterThan(0.5);
    });

    it('returns lower score for different patterns', () => {
      const base = mockItem('striped');
      const compare = mockItem('plaid');
      const score = patternScore(base, compare);
      expect(score).toBeLessThan(0.5);
    });

    it('solid is compatible with all patterns', () => {
      const patterns = ['striped', 'plaid', 'polka_dot', 'floral', 'graphic', 'checked'];
      const base = mockItem('solid');

      patterns.forEach((pattern) => {
        const compare = mockItem(pattern as any);
        const score = patternScore(base, compare);
        expect(score).toBeGreaterThan(0);
      });
    });

    it('returns consistent score for same patterns', () => {
      const patterns = ['striped', 'plaid', 'polka_dot', 'floral', 'graphic', 'checked'];

      patterns.forEach((pattern) => {
        const base = mockItem(pattern as any);
        const compare = mockItem(pattern as any);
        const score = patternScore(base, compare);
        expect(score).toBeGreaterThan(0.7);
      });
    });

    it('always returns value between 0 and 1', () => {
      const patterns = ['solid', 'striped', 'plaid', 'polka_dot', 'floral', 'graphic', 'checked'];

      patterns.forEach((p1) => {
        patterns.forEach((p2) => {
          const base = mockItem(p1 as any);
          const compare = mockItem(p2 as any);
          const score = patternScore(base, compare);
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(1);
        });
      });
    });
  });

  describe('lastWornScore', () => {
    it('returns 1 for never-worn items', () => {
      const base = mockItem('solid', 'red', null);
      const score = lastWornScore(base);
      expect(score).toBe(1);
    });

    it('returns lower score for recently worn items', () => {
      const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      const base = mockItem('solid', 'red', oneDayAgo);
      const score = lastWornScore(base);
      expect(score).toBeLessThan(0.5);
    });

    it('returns high score for items worn long ago', () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const base = mockItem('solid', 'red', thirtyDaysAgo);
      const score = lastWornScore(base);
      expect(score).toBeGreaterThan(0.7);
    });

    it('penalizes recently worn vs never worn', () => {
      const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

      const neverWorn = mockItem('solid', 'red', null);
      const recentWorn = mockItem('solid', 'red', oneDayAgo);

      expect(lastWornScore(neverWorn)).toBeGreaterThan(lastWornScore(recentWorn));
    });

    it('increases score with time elapsed since last wear', () => {
      const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const oneDay = mockItem('solid', 'red', oneDayAgo);
      const sevenDays = mockItem('solid', 'red', sevenDaysAgo);
      const thirtyDays = mockItem('solid', 'red', thirtyDaysAgo);

      const score1 = lastWornScore(oneDay);
      const score7 = lastWornScore(sevenDays);
      const score30 = lastWornScore(thirtyDays);

      expect(score1).toBeLessThan(score7);
      expect(score7).toBeLessThan(score30);
    });

    it('always returns value between 0 and 1', () => {
      const daysAgo = [0, 1, 7, 14, 30, 90, 180, 365];

      daysAgo.forEach((days) => {
        const date = days === 0 ? null : new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const base = mockItem('solid', 'red', date);
        const score = lastWornScore(base);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      });
    });

    it('does not mutate the original item', () => {
      const base = mockItem('solid', 'red', null);
      const clone = { ...base };
      lastWornScore(base);
      expect(base).toEqual(clone);
    });

    it('handles future dates gracefully', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const base = mockItem('solid', 'red', futureDate);
      const score = lastWornScore(base);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('monochromeScore', () => {
    it('returns high score for same color', () => {
      const base = mockItem('solid', 'red');
      const compare = mockItem('solid', 'red');
      const score = monochromeScore(base, compare);
      expect(score).toBeGreaterThan(0.9);
    });

    it('returns 0 when base color is missing', () => {
      const base = { ...mockItem(), color: undefined } as any;
      const compare = mockItem('solid', 'red');
      expect(monochromeScore(base, compare)).toBe(0);
    });

    it('returns lower score for different colors', () => {
      const base = mockItem('solid', 'red');
      const compare = mockItem('solid', 'blue');
      const score = monochromeScore(base, compare);
      expect(score).toBeLessThan(0.3);
    });

    it('handles all color combinations', () => {
      const colors = [
        'red',
        'blue',
        'green',
        'yellow',
        'orange',
        'purple',
        'pink',
        'white',
        'black',
        'gray',
        'brown',
      ];

      colors.forEach((color) => {
        const base = mockItem('solid', color as any);
        const compare = mockItem('solid', color as any);
        const score = monochromeScore(base, compare);
        expect(score).toBeGreaterThan(0.8);
      });
    });

    it('returns lower scores for different colors consistently', () => {
      const base = mockItem('solid', 'red');

      const differentColors = ['blue', 'green', 'yellow', 'purple'];

      differentColors.forEach((color) => {
        const compare = mockItem('solid', color as any);
        const score = monochromeScore(base, compare);
        expect(score).toBeLessThan(0.5);
      });
    });

    it('returns 0 when compare color is missing', () => {
      const base = mockItem('solid', 'red');
      const compare = { ...mockItem('solid', 'red'), color: undefined } as any;
      expect(monochromeScore(base, compare)).toBe(0);
    });

    it('always returns value between 0 and 1', () => {
      const colors = [
        'red',
        'blue',
        'green',
        'yellow',
        'orange',
        'purple',
        'pink',
        'white',
        'black',
        'gray',
        'brown',
      ];

      colors.forEach((color1) => {
        colors.forEach((color2) => {
          const base = mockItem('solid', color1 as any);
          const compare = mockItem('solid', color2 as any);
          const score = monochromeScore(base, compare);
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(1);
        });
      });
    });
  });
});
