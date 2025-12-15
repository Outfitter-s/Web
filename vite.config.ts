import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { enhancedImages } from '@sveltejs/enhanced-img';

export default defineConfig({
  plugins: [enhancedImages(), tailwindcss(), sveltekit()],
  server: {
    fs: {
      allow: ['./config.json', 'assets/', './VERSION'],
    },
  },
  assetsInclude: ['transactional/**/*.html'],
  resolve: process.env.VITEST
    ? {
        conditions: ['browser'],
      }
    : undefined,
  test: {
    environment: 'jsdom',
  },
});
