import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { enhancedImages } from '@sveltejs/enhanced-img';

export default defineConfig({
  plugins: [enhancedImages(), tailwindcss(), sveltekit()],
  server: {
    fs: {
      allow: ['./config.json', 'assets/'],
    },
    allowedHosts: ['outfitter.home.paillaugue.fr'],
  },
  assetsInclude: ['transactional/**/*.html'],
});
