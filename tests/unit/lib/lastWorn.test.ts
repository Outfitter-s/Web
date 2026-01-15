import { describe, it, expect } from 'vitest';
import { lastWornScore } from '$lib/server/db/outfitStrategies/lastWorn';
import type { ScoredClothingItem } from '$lib/types';

const mockItem = (lastWornAt?: Date | null): ScoredClothingItem => ({
  id: '1',
  imageUrl: 'https://example.com/image.jpg',
  type: 'shirt',
  color: 'red',
  pattern: 'solid',
  createdAt: new Date(),
  name: 'Test Item',
  description: null,
  lastWornAt: lastWornAt || null,
  userId: '123',
  score: 0,
});

describe('lastWornScore', () => {
  describe('null and missing items', () => {
    it('returns 1 for null item', () => {
      const score = lastWornScore(null);
      expect(score).toBe(1);
    });

    it('returns 1 for item with no lastWornAt', () => {
      const item = mockItem(null);
      const score = lastWornScore(item);
      expect(score).toBe(1);
    });

    it('returns 1 for brand new item never worn', () => {
      const item = mockItem(undefined);
      const score = lastWornScore(item);
      expect(score).toBe(1);
    });
  });

  describe('recently worn items', () => {
    it('returns low score for item worn today', () => {
      const today = new Date();
      const item = mockItem(today);
      const score = lastWornScore(item);
      expect(score).toBeLessThan(0.1);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('returns low score for item worn 1 day ago', () => {
      const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      const item = mockItem(yesterday);
      const score = lastWornScore(item);
      expect(score).toBeLessThan(0.3);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('returns moderate score for item worn 7 days ago', () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const item = mockItem(weekAgo);
      const score = lastWornScore(item);
      expect(score).toBeGreaterThan(0.3);
      expect(score).toBeLessThan(0.65);
    });

    it('returns moderate score for item worn 14 days ago', () => {
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const item = mockItem(twoWeeksAgo);
      const score = lastWornScore(item);
      expect(score).toBeGreaterThan(0.5);
      expect(score).toBeLessThan(0.8);
    });
  });

  describe('rarely worn items', () => {
    it('returns high score for item worn 30 days ago', () => {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const item = mockItem(monthAgo);
      const score = lastWornScore(item);
      expect(score).toBeGreaterThan(0.9);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('returns high score for item worn 60 days ago', () => {
      const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      const item = mockItem(twoMonthsAgo);
      const score = lastWornScore(item);
      expect(score).toBeGreaterThanOrEqual(1);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('returns maximum score for item worn 1 year ago', () => {
      const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      const item = mockItem(yearAgo);
      const score = lastWornScore(item);
      expect(score).toBe(1);
    });
  });

  describe('score boundaries', () => {
    it('always returns value between 0 and 1', () => {
      const daysAgo = [0, 1, 7, 14, 30, 60, 90, 180, 365, 730];
      daysAgo.forEach((days) => {
        const pastDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const item = mockItem(pastDate);
        const score = lastWornScore(item);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      });
    });

    it('score increases monotonically as days increase', () => {
      const scores = [];
      for (let days = 0; days <= 30; days += 5) {
        const pastDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const item = mockItem(pastDate);
        const score = lastWornScore(item);
        scores.push(score);
      }

      for (let i = 0; i < scores.length - 1; i++) {
        expect(scores[i]).toBeLessThanOrEqual(scores[i + 1]);
      }
    });

    it('score difference is logarithmic, not linear', () => {
      const day0 = new Date(Date.now());
      const day1 = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      const day7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const day14 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

      const score0 = lastWornScore(mockItem(day0));
      const score1 = lastWornScore(mockItem(day1));
      const score7 = lastWornScore(mockItem(day7));
      const score14 = lastWornScore(mockItem(day14));

      const diff_0_to_1 = score1 - score0;
      const diff_7_to_14 = score14 - score7;

      expect(diff_0_to_1).toBeGreaterThan(diff_7_to_14);
    });
  });

  describe('edge cases', () => {
    it('handles item worn in the future gracefully', () => {
      const future = new Date(Date.now() + 1000);
      const item = mockItem(future);
      const score = lastWornScore(item);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('handles very old dates (before 2000)', () => {
      const oldDate = new Date('2000-01-01');
      const item = mockItem(oldDate);
      const score = lastWornScore(item);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
      expect(score).toBe(1);
    });
  });
});
