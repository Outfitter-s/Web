import { describe, it, expect } from 'vitest';
import { complementaryScore } from '$lib/server/db/outfitStrategies/complementary';
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

describe('complementaryScore', () => {
  it('returns 0 when base color is missing', () => {
    const base = { ...mockItem(), color: undefined } as any;
    const compare = mockItem('green');
    expect(complementaryScore(base, compare)).toBe(0);
  });

  it('returns 0 when compare color is missing', () => {
    const base = mockItem('red');
    const compare = { ...mockItem(), color: undefined } as any;
    expect(complementaryScore(base, compare)).toBe(0);
  });

  it('returns 0 for identical colors', () => {
    const base = mockItem('red');
    const compare = mockItem('red');
    expect(complementaryScore(base, compare)).toBe(0);
  });

  it('returns high score for red and green', () => {
    const base = mockItem('red');
    const compare = mockItem('green');
    const score = complementaryScore(base, compare);
    expect(score).toBeGreaterThan(0.5);
  });

  it('returns high score for blue and orange', () => {
    const base = mockItem('blue');
    const compare = mockItem('orange');
    const score = complementaryScore(base, compare);
    expect(score).toBeGreaterThan(0);
  });

  it('returns high score for yellow and purple', () => {
    const base = mockItem('yellow');
    const compare = mockItem('purple');
    const score = complementaryScore(base, compare);
    expect(score).toBeGreaterThan(0.7);
  });

  it('returns low score for non-complementary colors', () => {
    const base = mockItem('red');
    const compare = mockItem('blue');
    const score = complementaryScore(base, compare);
    expect(score).toBeLessThan(0.7);
  });

  it('handles neutral colors with complementary', () => {
    const base = mockItem('white');
    const compare = mockItem('black');
    const score = complementaryScore(base, compare);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
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
        const base = mockItem(color1 as any);
        const compare = mockItem(color2 as any);
        const score = complementaryScore(base, compare);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      });
    });
  });
});
