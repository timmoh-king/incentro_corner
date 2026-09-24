import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8311,
    host: true,
    proxy: {
      // HeyTaco's API sends no CORS headers, so the browser can't call it
      // directly (see README "TV mode"). The dev server makes the request
      // instead — a plain server-to-server call isn't subject to CORS.
      '/api/heytaco': {
        target: 'https://api.heytaco.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/heytaco/, ''),
      },
    },
  },
  build: { outDir: 'build', sourcemap: false },
});
