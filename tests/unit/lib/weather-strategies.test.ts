import { describe, it, expect } from 'vitest';
import { rainScore } from '$lib/server/db/outfitStrategies/rain';
import { tempScore } from '$lib/server/db/outfitStrategies/temp';
import { colorForUVScore } from '$lib/server/db/outfitStrategies/colorForUV';
import type { ScoredClothingItem, Weather } from '$lib/types';

const mockItem = (type?: string, description?: string): ScoredClothingItem => ({
  id: '1',
  imageUrl: 'https://example.com/image.jpg',
  type: (type || 'shirt') as any,
  color: 'red',
  pattern: 'solid',
  createdAt: new Date(),
  name: 'Test Item',
  description: description || null,
  lastWornAt: null,
  userId: '123',
  score: 0,
});

const mockWeather = (rain: number): Weather => ({
  rain,
  temp: 15,
  uv: 5,
});

describe('Weather-based scoring strategies', () => {
  describe('rainScore', () => {
    it('returns 1 for waterproof items in heavy rain', () => {
      const item = mockItem('jacket', 'waterproof material');
      const weather = mockWeather(2);
      const score = rainScore(item, weather);
      expect(score).toBe(1);
    });

    it('returns 0.2 for non-waterproof items in heavy rain', () => {
      const item = mockItem('shirt', 'cotton');
      const weather = mockWeather(2);
      const score = rainScore(item, weather);
      expect(score).toBe(0.2);
    });

    it('returns 0.4 for waterproof items in light rain', () => {
      const item = mockItem('jacket', 'waterproof material');
      const weather = mockWeather(0.5);
      const score = rainScore(item, weather);
      expect(score).toBe(0.4);
    });

    it('returns 0.6 for non-waterproof items in light rain', () => {
      const item = mockItem('shirt', 'cotton');
      const weather = mockWeather(0.5);
      const score = rainScore(item, weather);
      expect(score).toBe(0.6);
    });

    it('recognizes waterproof materials', () => {
      const waterproofItem = mockItem('jacket', 'waterproof material');
      const weather = mockWeather(2);
      const score = rainScore(waterproofItem, weather);
      expect(score).toBe(1);
    });

    it('always returns value between 0 and 1', () => {
      const item = mockItem('jacket', 'random description');
      const weather = mockWeather(1.5);
      const score = rainScore(item, weather);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('tempScore', () => {
    // it('returns high score for warm items in cold weather', () => {
    //     const item = mockItem('sweater');
    //     const weather = mockWeather(0);
    //     weather.temp = 0;
    //     const score = tempScore(item, weather);
    //     expect(score).toBeGreaterThan(0.3);
    // });

    it('returns high score for light items in warm weather', () => {
      const item = mockItem('shirt');
      const weather = mockWeather(0);
      weather.temp = 25;
      const score = tempScore(item, weather);
      expect(score).toBeGreaterThan(0.3);
    });

    it('handles extreme cold (-20°C)', () => {
      const item = mockItem('jacket');
      const weather = mockWeather(0);
      weather.temp = -20;
      const score = tempScore(item, weather);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('handles extreme heat (40°C)', () => {
      const item = mockItem('shirt');
      const weather = mockWeather(0);
      weather.temp = 40;
      const score = tempScore(item, weather);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('handles moderate temperature (15°C)', () => {
      const item = mockItem('shirt');
      const weather = mockWeather(0);
      weather.temp = 15;
      const score = tempScore(item, weather);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('score changes with temperature for the same item', () => {
      const item = mockItem('jacket');

      const weatherCold = mockWeather(0);
      weatherCold.temp = 0;
      const coldScore = tempScore(item, weatherCold);

      const weatherWarm = mockWeather(0);
      weatherWarm.temp = 30;
      const warmScore = tempScore(item, weatherWarm);

      expect(coldScore).not.toBe(warmScore);
    });

    it('always returns value between 0 and 1', () => {
      const temperatures = [-30, -10, 0, 10, 15, 20, 25, 30, 40];
      const item = mockItem('jacket');

      temperatures.forEach((temp) => {
        const weather = mockWeather(0);
        weather.temp = temp;
        const score = tempScore(item, weather);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('colorForUVScore', () => {
    it('returns high score for light colors in high UV', () => {
      const item = mockItem('shirt');
      item.color = 'white';
      const weather = mockWeather(0);
      weather.uv = 10;
      const score = colorForUVScore(item, weather);
      expect(score).toBeGreaterThan(0.7);
    });

    it('returns lower score for dark colors in high UV', () => {
      const item = mockItem('shirt');
      item.color = 'black';
      const weather = mockWeather(0);
      weather.uv = 10;
      const score = colorForUVScore(item, weather);
      expect(score).toBeLessThan(0.7);
    });

    it('returns decent score for chromatic colors in low UV', () => {
      const item = mockItem('shirt');
      item.color = 'red';
      const weather = mockWeather(0);
      weather.uv = 1;
      const score = colorForUVScore(item, weather);
      expect(score).toBeGreaterThan(0.1);
    });

    it('handles UV index 0 (no sun)', () => {
      const item = mockItem('shirt');
      item.color = 'red';
      const weather = mockWeather(0);
      weather.uv = 0;
      const score = colorForUVScore(item, weather);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('handles high UV index 11+', () => {
      const item = mockItem('shirt');
      item.color = 'white';
      const weather = mockWeather(0);
      weather.uv = 12;
      const score = colorForUVScore(item, weather);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('light colors score higher than dark colors in high UV', () => {
      const lightItem = mockItem('shirt');
      lightItem.color = 'white';
      const darkItem = mockItem('shirt');
      darkItem.color = 'black';

      const weather = mockWeather(0);
      weather.uv = 10;

      const lightScore = colorForUVScore(lightItem, weather);
      const darkScore = colorForUVScore(darkItem, weather);

      expect(lightScore).toBeGreaterThan(darkScore);
    });

    it('always returns value between 0 and 1', () => {
      const uvIndexes = [0, 1, 3, 5, 8, 10, 12];
      const colors = ['red', 'white', 'black', 'blue', 'yellow', 'pink', 'orange'];

      uvIndexes.forEach((uv) => {
        colors.forEach((color) => {
          const item = mockItem('shirt');
          item.color = color as any;
          const weather = mockWeather(0);
          weather.uv = uv;

          const score = colorForUVScore(item, weather);
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(1);
        });
      });
    });
  });
});
