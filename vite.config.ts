import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/meetup/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      manifest: {
        name: 'Swimming Pals Planner',
        short_name: 'Swim Pals',
        description: 'Scheduling meetups for people who find it very hard.',
        theme_color: '#F5F7F2',
        background_color: '#FFFFFF',
        display: 'standalone',
        start_url: '/meetup/',
        icons: [
          { src: '/meetup/icon-48x48.png', sizes: '48x48', type: 'image/png', purpose: 'any' },
          { src: '/meetup/icon-72x72.png', sizes: '72x72', type: 'image/png', purpose: 'any' },
          { src: '/meetup/icon-96x96.png', sizes: '96x96', type: 'image/png', purpose: 'any' },
          { src: '/meetup/icon-128x128.png', sizes: '128x128', type: 'image/png', purpose: 'any' },
          { src: '/meetup/icon-144x144.png', sizes: '144x144', type: 'image/png', purpose: 'any' },
          { src: '/meetup/icon-152x152.png', sizes: '152x152', type: 'image/png', purpose: 'any' },
          { src: '/meetup/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/meetup/icon-256x256.png', sizes: '256x256', type: 'image/png', purpose: 'any' },
          { src: '/meetup/icon-384x384.png', sizes: '384x384', type: 'image/png', purpose: 'any' },
          { src: '/meetup/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/meetup/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/meetup/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'supabase-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
});
