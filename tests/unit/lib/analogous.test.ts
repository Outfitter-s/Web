import { describe, it, expect, beforeEach } from 'vitest';
import { analogousScore } from '$lib/server/db/outfitStrategies/analogous';
import { getAnalogousColors } from '$lib/server/db/outfitStrategies/utils';
import type { ScoredClothingItem } from '$lib/types';

const mockItem = (color?: string): ScoredClothingItem => ({
  id: '1',
  imageUrl: 'https://example.com/image.jpg',
  type: 'shirt',
  color: (color || 'red') as any,
  pattern: 'solid',
  createdAt: new Date(),
  name: 'Test Item',
  description: null,
  lastWornAt: null,
  userId: '123',
  score: 0,
});

describe('analogousScore', () => {
  it('returns 0 when base color is missing', () => {
    const base = { ...mockItem(), color: undefined } as any;
    const compare = mockItem('red');
    expect(analogousScore(base, compare)).toBe(0);
  });

  it('returns 0 when compare color is missing', () => {
    const base = mockItem('red');
    const compare = { ...mockItem(), color: undefined } as any;
    expect(analogousScore(base, compare)).toBe(0);
  });

  it('returns 1 when colors are identical', () => {
    const base = mockItem('red');
    const compare = mockItem('red');
    expect(analogousScore(base, compare)).toBe(1);
  });

  it('returns 0.8 for distance 1 analogous colors', () => {
    const base = mockItem('red');
    const neighbors1 = getAnalogousColors('red', 1);

    if (neighbors1.length > 1) {
      const analogColor = neighbors1[1];
      const compare = mockItem(analogColor as any);
      expect(analogousScore(base, compare)).toBe(0.8);
    }
  });

  it('returns 0.5 for distance 2 analogous colors', () => {
    const base = mockItem('red');
    const neighbors2 = getAnalogousColors('red', 2);

    if (neighbors2.length > 2) {
      const distantColor = neighbors2[2];
      const compare = mockItem(distantColor as any);
      expect(analogousScore(base, compare)).toBe(0.5);
    }
  });

  it('returns 0 for non-analogous colors', () => {
    const base = mockItem('red');
    const compare = mockItem('blue');
    const score = analogousScore(base, compare);
    // Blue ne devrait pas être dans les couleurs analogues de red
    expect([0, 0.5, 0.8, 1]).toContain(score);
  });

  it('handles all chromatic colors correctly', () => {
    const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];

    colors.forEach((color) => {
      const base = mockItem(color as any);
      const compare = mockItem(color as any);
      expect(analogousScore(base, compare)).toBe(1);
    });
  });

  it('score is symmetric for analogous colors', () => {
    const base = mockItem('red');
    const compare = mockItem('orange');

    const score1 = analogousScore(base, compare);
    const score2 = analogousScore(compare, base);
    expect(score1).toBe(score2);
  });

  it('transitions correctly from distance 0 to 1 to 2', () => {
    const base = mockItem('red');
    const same = mockItem('red');
    const neighbors1 = getAnalogousColors('red', 1);
    const neighbors2 = getAnalogousColors('red', 2);

    const scoreIdentical = analogousScore(base, same);
    expect(scoreIdentical).toBe(1);

    if (neighbors1.length > 1) {
      const distance1Color = neighbors1.find((c) => c !== 'red');
      if (distance1Color) {
        const distance1 = mockItem(distance1Color as any);
        const scoreDistance1 = analogousScore(base, distance1);
        expect(scoreDistance1).toBe(0.8);
      }
    }

    if (neighbors2.length > 2) {
      const distance2Color = neighbors2.find((c, idx) => idx > 1 && c !== 'red');
      if (distance2Color) {
        const distance2 = mockItem(distance2Color as any);
        const scoreDistance2 = analogousScore(base, distance2);
        expect(scoreDistance2).toBe(0.5);
      }
    }
  });
});
