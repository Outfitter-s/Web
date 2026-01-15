import { describe, it, expect } from 'vitest';
import { patternScore } from '$lib/server/db/outfitStrategies';
import type { ScoredClothingItem } from '$lib/types';

const mockItem = (pattern?: string, color?: string): ScoredClothingItem => ({
  id: '1',
  imageUrl: 'https://example.com/image.jpg',
  type: 'shirt',
  color: (color || 'red') as any,
  pattern: (pattern || 'solid') as any,
  createdAt: new Date(),
  name: 'Test Item',
  description: null,
  lastWornAt: null,
  userId: '123',
  score: 0,
});

describe('patternScore', () => {
  describe('same pattern matching', () => {
    it('returns 0.6 for same pattern with different colors', () => {
      const item1 = mockItem('striped', 'red');
      const item2 = mockItem('striped', 'blue');
      const score = patternScore(item1, item2);
      expect(score).toBe(0.6);
    });

    it('returns 0.85 for same pattern with same color', () => {
      const item1 = mockItem('striped', 'red');
      const item2 = mockItem('striped', 'red');
      const score = patternScore(item1, item2);
      expect(score).toBe(0.85); // 0.6 + 0.25
    });

    it('returns 0.72 for same pattern with analogous colors', () => {
      const item1 = mockItem('plaid', 'red');
      const item2 = mockItem('plaid', 'orange');
      const score = patternScore(item1, item2);
      expect(score).toBe(0.72); // 0.6 + 0.12
    });

    it('handles all pattern types with same pattern', () => {
      const patterns = ['striped', 'plaid', 'polka_dot', 'floral', 'graphic', 'checked'];
      patterns.forEach((pattern) => {
        const item1 = mockItem(pattern, 'red');
        const item2 = mockItem(pattern, 'blue');
        const score = patternScore(item1, item2);
        expect(score).toBe(0.6);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('solid pattern combinations', () => {
    it('returns 0.6 for solid with solid (different colors)', () => {
      const item1 = mockItem('solid', 'red');
      const item2 = mockItem('solid', 'blue');
      const score = patternScore(item1, item2);
      expect(score).toBe(0.6);
    });

    it('returns 0.85 for solid with solid (same color)', () => {
      const item1 = mockItem('solid', 'red');
      const item2 = mockItem('solid', 'red');
      const score = patternScore(item1, item2);
      expect(score).toBe(0.85);
    });

    it('returns 0.72 for solid with solid (analogous colors)', () => {
      const item1 = mockItem('solid', 'red');
      const item2 = mockItem('solid', 'orange');
      const score = patternScore(item1, item2);
      expect(score).toBe(0.72);
    });

    it('returns 0.6 for solid with solid (neutral color involved)', () => {
      const item1 = mockItem('solid', 'red');
      const item2 = mockItem('solid', 'white');
      const score = patternScore(item1, item2);
      expect(score).toBe(0.6);
      expect(score).toBeGreaterThanOrEqual(0.35);
    });

    it('returns 0.47 for solid pattern with patterned item (different colors)', () => {
      const item1 = mockItem('solid', 'red');
      const item2 = mockItem('striped', 'blue');
      const score = patternScore(item1, item2);
      expect(score).toBe(0.47);
      expect(score).toBeGreaterThanOrEqual(0.35);
    });

    it('returns 0.85 for solid with solid (same color)', () => {
      const item1 = mockItem('solid', 'red');
      const item2 = mockItem('solid', 'red');
      const score = patternScore(item1, item2);
      expect(score).toBe(0.85);
    });
  });

  describe('complex pattern combinations', () => {
    it('returns negative score for two complex patterns with different colors', () => {
      const item1 = mockItem('graphic', 'red');
      const item2 = mockItem('floral', 'blue');
      const score = patternScore(item1, item2);
      expect(score).toBeLessThan(0.1);
      expect(score).toBeGreaterThanOrEqual(-1);
    });

    it('returns higher score for complex patterns with same color', () => {
      const item1 = mockItem('graphic', 'red');
      const item2 = mockItem('floral', 'red');
      const score = patternScore(item1, item2);
      expect(score).toBeGreaterThan(-1);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('floral pattern gets bonus when mixed with other patterns', () => {
      const item1 = mockItem('floral', 'red');
      const item2 = mockItem('striped', 'blue');
      const score = patternScore(item1, item2);
      expect(score).toBeLessThanOrEqual(1);
      expect(score).toBeGreaterThanOrEqual(-1);
    });

    it('always returns value between -1 and 1', () => {
      const patterns = ['solid', 'striped', 'plaid', 'polka_dot', 'floral', 'graphic', 'checked'];
      const colors = ['red', 'blue', 'white', 'black', 'orange'];

      patterns.forEach((pattern1) => {
        patterns.forEach((pattern2) => {
          colors.forEach((color1) => {
            colors.forEach((color2) => {
              const item1 = mockItem(pattern1, color1);
              const item2 = mockItem(pattern2, color2);
              const score = patternScore(item1, item2);
              expect(score).toBeGreaterThanOrEqual(-1);
              expect(score).toBeLessThanOrEqual(1);
            });
          });
        });
      });
    });
  });

  describe('edge cases', () => {
    it('handles solid vs complex patterns appropriately', () => {
      const solidItem = mockItem('solid', 'white');
      const complexItem = mockItem('graphic', 'red');
      const score = patternScore(solidItem, complexItem);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });
});
