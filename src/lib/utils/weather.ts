import { browser } from '$app/environment';
import type { Weather } from '$lib/types';

// Use the Cache API in the browser for weather data
const CACHE_KEY = 'weather-data';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Fetch weather data with caching since the API does not provides a cache header
export async function getWeather(): Promise<Weather | { error: string }> {
  try {
    if (!browser || !('caches' in window)) {
      // Fallback to direct fetch if Cache API is not available (SSR or old browsers)
      const weather = await fetchWeatherDirect();
      return weather;
    }

    const cache = await caches.open('weather-cache');
    const cachedResponse = await cache.match(CACHE_KEY);

    if (cachedResponse) {
      const { timestamp, data } = await cachedResponse.json();
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data;
      }
    }

    const weather = await fetchWeatherDirect();
    const cacheData = new Response(JSON.stringify({ timestamp: Date.now(), data: weather }), {
      headers: { 'Content-Type': 'application/json' },
    });
    await cache.put(CACHE_KEY, cacheData);
    return weather;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { error: msg };
  }
}

async function fetchWeatherDirect(): Promise<Weather> {
  const response = await fetch(`https://wttr.in?format=j2`);
  if (!response.ok) {
    throw new Error('errors.server.weatherFetchFailed');
  }

  const data = await response.json();
  const current = data.current_condition[0];

  const weather: Weather = {
    temp: parseInt(current.FeelsLikeC),
    desc: current.weatherDesc[0].value,
    rain: Number(current.precipMM),
    uv: parseInt(current.uvIndex),
  };
  return weather;
}
