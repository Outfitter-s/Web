import { describe, it, expect } from 'vitest';
import { triadicScore } from '$lib/server/db/outfitStrategies/triadic';
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

describe('triadicScore', () => {
  it('returns 0 when base color is missing', () => {
    const base = { ...mockItem(), color: undefined } as any;
    const compare = mockItem('blue');
    expect(triadicScore(base, compare)).toBe(0);
  });

  it('returns 0 when compare color is missing', () => {
    const base = mockItem('red');
    const compare = { ...mockItem(), color: undefined } as any;
    expect(triadicScore(base, compare)).toBe(0);
  });

  it('returns 0 for identical colors', () => {
    const base = mockItem('red');
    const compare = mockItem('red');
    expect(triadicScore(base, compare)).toBe(0);
  });

  it('returns high score for triadic colors (red, blue, yellow)', () => {
    const base = mockItem('red');
    const compare = mockItem('blue');
    const score = triadicScore(base, compare);
    expect(score).toBeGreaterThan(0.6);
  });

  it('returns high score for triadic colors (red, yellow, blue)', () => {
    const base = mockItem('red');
    const compare = mockItem('yellow');
    const score = triadicScore(base, compare);
    expect(score).toBeGreaterThan(0.6);
  });

  it('returns high score for secondary triadic colors (orange, green, purple)', () => {
    const base = mockItem('orange');
    const compare = mockItem('green');
    const score = triadicScore(base, compare);
    expect(score).toBeGreaterThan(0.6);
  });

  it('returns lower score for non-triadic colors', () => {
    const base = mockItem('red');
    const compare = mockItem('orange');
    const score = triadicScore(base, compare);
    expect(score).toBeLessThan(0.3);
  });

  it('score is symmetric for triadic colors', () => {
    const base = mockItem('red');
    const compare = mockItem('blue');

    const score1 = triadicScore(base, compare);
    const score2 = triadicScore(compare, base);
    expect(score1).toBe(score2);
  });

  it('handles neutral colors in triadic scheme', () => {
    const base = mockItem('white');
    const compare = mockItem('red');
    const score = triadicScore(base, compare);
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
        const score = triadicScore(base, compare);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      });
    });
  });
});
