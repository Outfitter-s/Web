import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getComplementaryColor,
  getComplementaryColors,
  getAnalogousColors,
  getTriadicColors,
} from '$lib/server/db/outfitStrategies/utils';
import { COLOR_WHEEL, NEUTRAL_COLORS, type ClothingItemColor } from '$lib/types';

describe('Color harmony functions', () => {
  describe('getComplementaryColor', () => {
    it('returns a chromatic color for neutral colors', () => {
      const neutralColors: ClothingItemColor[] = ['white', 'black', 'gray', 'brown'];
      const chromaticColors = COLOR_WHEEL.filter((c) => !NEUTRAL_COLORS.includes(c));

      neutralColors.forEach((color) => {
        const result = getComplementaryColor(color);
        expect(chromaticColors).toContain(result);
      });
    });

    it('returns the complementary color for chromatic colors', () => {
      const redComp = getComplementaryColor('red');
      expect(redComp).toBeDefined();
      expect(COLOR_WHEEL).toContain(redComp);

      const blueComp = getComplementaryColor('blue');
      expect(blueComp).toBeDefined();
      expect(COLOR_WHEEL).toContain(blueComp);
    });

    it('returns the same color if not found in COLOR_WHEEL', () => {
      const invalidColor = 'invalid' as ClothingItemColor;
      const result = getComplementaryColor(invalidColor);
      expect(result).toBe(invalidColor);
    });

    it('returns different colors for opposite colors', () => {
      const red = getComplementaryColor('red');
      const green = getComplementaryColor('green');
      expect(red).not.toBe('red');
      expect(green).not.toBe('green');
    });
  });

  describe('getComplementaryColors', () => {
    it('returns all chromatic colors for neutral colors', () => {
      const neutralColors: ClothingItemColor[] = ['white', 'black', 'gray', 'brown'];
      const chromaticColors = COLOR_WHEEL.filter((c) => !NEUTRAL_COLORS.includes(c));

      neutralColors.forEach((color) => {
        const result = getComplementaryColors(color);
        expect(result).toEqual(chromaticColors);
      });
    });

    it('returns the base color, complementary, and neighbors', () => {
      const result = getComplementaryColors('red');

      expect(result).toContain('red');
      expect(result.length).toBeGreaterThan(1);

      const redCount = result.filter((c) => c === 'red').length;
      expect(redCount).toBe(1);
    });

    it('filters out neutral colors from neighbors', () => {
      const chromaticColors = COLOR_WHEEL.filter((c) => !NEUTRAL_COLORS.includes(c));

      chromaticColors.forEach((color) => {
        const result = getComplementaryColors(color);
        const hasNeutralsExceptBase = result.some((c) => NEUTRAL_COLORS.includes(c) && c !== color);
        expect(hasNeutralsExceptBase).toBe(false);
      });
    });

    it('handles edge case when complementary is not in COLOR_WHEEL', () => {
      const result = getComplementaryColors('red');
      expect(result.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getAnalogousColors', () => {
    it('returns only the color if not found in COLOR_WHEEL', () => {
      const invalidColor = 'invalid' as ClothingItemColor;
      const result = getAnalogousColors(invalidColor);
      expect(result).toEqual([invalidColor]);
    });

    it('returns color plus all chromatic colors for neutral colors', () => {
      const neutralColors: ClothingItemColor[] = ['white', 'black', 'gray', 'brown'];

      neutralColors.forEach((color) => {
        const result = getAnalogousColors(color);
        const chromaticColors = COLOR_WHEEL.filter((c) => !NEUTRAL_COLORS.includes(c));

        expect(result[0]).toBe(color);
        expect(result.slice(1)).toEqual(chromaticColors);
      });
    });

    it('returns analogous colors at distance 1', () => {
      const result = getAnalogousColors('red', 1);

      expect(result).toContain('red');
      expect(result.length).toBeGreaterThan(1);
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('returns more colors at distance 2', () => {
      const result1 = getAnalogousColors('blue', 1);
      const result2 = getAnalogousColors('blue', 2);

      expect(result2.length).toBeGreaterThanOrEqual(result1.length);
    });

    it('filters out neutral colors from analogous colors', () => {
      const chromaticColors = COLOR_WHEEL.filter((c) => !NEUTRAL_COLORS.includes(c));

      chromaticColors.forEach((color) => {
        const result = getAnalogousColors(color, 2);
        const hasNeutrals = result.some((c) => NEUTRAL_COLORS.includes(c) && c !== color);
        expect(hasNeutrals).toBe(false);
      });
    });

    it('wraps around COLOR_WHEEL correctly', () => {
      const firstColor = COLOR_WHEEL.find((c) => !NEUTRAL_COLORS.includes(c))!;
      const result = getAnalogousColors(firstColor, 1);

      expect(result).toContain(firstColor);
      expect(result.length).toBeGreaterThan(1);
    });

    it('returns unique colors only', () => {
      const result = getAnalogousColors('red', 2);
      const uniqueColors = new Set(result);
      expect(result.length).toBe(uniqueColors.size);
    });
  });

  describe('getTriadicColors', () => {
    it('returns triadic colors for primary colors', () => {
      const redTriadic = getTriadicColors('red');
      expect(redTriadic).toContain('blue');
      expect(redTriadic).toContain('yellow');
      expect(redTriadic).toContain('white');
      expect(redTriadic).toContain('black');

      const blueTriadic = getTriadicColors('blue');
      expect(blueTriadic).toContain('yellow');
      expect(blueTriadic).toContain('red');
    });

    it('returns triadic colors for secondary colors', () => {
      const orangeTriadic = getTriadicColors('orange');
      expect(orangeTriadic).toContain('green');
      expect(orangeTriadic).toContain('purple');

      const greenTriadic = getTriadicColors('green');
      expect(greenTriadic).toContain('purple');
      expect(greenTriadic).toContain('orange');
    });

    it('returns all colors except itself for neutral colors', () => {
      const whiteTriadic = getTriadicColors('white');
      expect(whiteTriadic).toContain('red');
      expect(whiteTriadic).toContain('blue');
      expect(whiteTriadic).not.toContain('white');
      expect(whiteTriadic.length).toBeGreaterThan(5);

      const blackTriadic = getTriadicColors('black');
      expect(blackTriadic).not.toContain('black');
    });

    it('returns triadic colors for pink', () => {
      const pinkTriadic = getTriadicColors('pink');
      expect(pinkTriadic).toContain('blue');
      expect(pinkTriadic).toContain('green');
      expect(pinkTriadic).toContain('white');
    });

    it('returns the color itself for unknown colors', () => {
      const invalidColor = 'invalid' as ClothingItemColor;
      const result = getTriadicColors(invalidColor);
      expect(result).toEqual([invalidColor]);
    });

    it('always includes neutral colors for chromatic colors', () => {
      const chromaticColors = COLOR_WHEEL.filter((c) => !NEUTRAL_COLORS.includes(c));

      chromaticColors.forEach((color) => {
        const result = getTriadicColors(color);
        NEUTRAL_COLORS.forEach((neutral) => {
          if (neutral !== color) {
            expect(result).toContain(neutral);
          }
        });
      });
    });

    it('returns consistent results for same input', () => {
      const result1 = getTriadicColors('red');
      const result2 = getTriadicColors('red');
      expect(result1).toEqual(result2);
    });
  });

  describe('Color harmony integration', () => {
    it('complementary and analogous colors should be different', () => {
      const color: ClothingItemColor = 'red';
      const complementary = getComplementaryColor(color);
      const analogous = getAnalogousColors(color, 1);

      expect(analogous).not.toContain(complementary);
    });

    it('all color functions handle all COLOR_WHEEL colors', () => {
      COLOR_WHEEL.forEach((color) => {
        expect(() => getComplementaryColor(color)).not.toThrow();
        expect(() => getComplementaryColors(color)).not.toThrow();
        expect(() => getAnalogousColors(color)).not.toThrow();
        expect(() => getTriadicColors(color)).not.toThrow();
      });
    });

    it('no color function returns empty array', () => {
      COLOR_WHEEL.forEach((color) => {
        expect(getComplementaryColors(color).length).toBeGreaterThan(0);
        expect(getAnalogousColors(color).length).toBeGreaterThan(0);
        expect(getTriadicColors(color).length).toBeGreaterThan(0);
      });
    });
  });
});
