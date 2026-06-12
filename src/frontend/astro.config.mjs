// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import vue from '@astrojs/vue';
import { execSync } from 'child_process';
import AstroPWA from '@vite-pwa/astro';

// https://astro.build/config
// Get git commit hash for version display
function getGitCommitHash() {
  try {
    // Try current directory first, then parent (for Docker builds)
    return execSync('git rev-parse --short HEAD 2>/dev/null || git -C .. rev-parse --short HEAD 2>/dev/null').toString().trim();
  } catch {
    return 'dev';
  }
}

export default defineConfig({
  // Site URL for canonical links, sitemaps, and proper HTTPS handling
  site: 'https://bashkirtseff.org',

  redirects: {
    // Legacy redirects from old 2-digit to new 3-digit carnet URLs
    '/original/00': '/original/000',
    '/original/00/preface': '/original/000',
    '/cz/00': '/cz/000',
    '/cz/00/preface': '/cz/000',
    '/original/01': '/original/001',
    '/original/02': '/original/002',
    '/cz/01': '/cz/001',
    '/cz/02': '/cz/002',
    // Redirect bare /glossary/ to /original/glossary/
    '/glossary': '/original/glossary',
  },

  build: {
    concurrency: 4,
  },

  vite: {
    plugins: [tailwindcss()],
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.1.0'),
      __GIT_COMMIT__: JSON.stringify(getGitCommitHash()),
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_I18N_FULL_INSTALL__: true,
      __VUE_I18N_LEGACY_API__: false
    }
  },

  integrations: [
    vue({
      appEntrypoint: '/src/vue-app'
    }),
    AstroPWA({
      mode: 'production',
      base: '/',
      scope: '/',
      includeAssets: ['favicon.svg'],
      registerType: 'autoUpdate',
      manifest: {
        name: 'Marie Bashkirtseff — The Complete Diary',
        short_name: 'Bashkirtseff',
        description: 'The complete, unabridged diary of Marie Bashkirtseff',
        lang: 'en',
        theme_color: '#B45309',
        background_color: '#FFF8F0',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/?source=pwa',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' },
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ]
      },
      workbox: {
        // NO navigateFallback here: with Workbox generateSW it registers a
        // NavigationRoute BEFORE the runtimeCaching routes, which serves the
        // fallback for EVERY navigation (even online) on a multi-page site.
        // This took down the whole site once the SW got registered.
        // Offline fallback for uncached pages needs injectManifest +
        // setCatchHandler if we want it back.
        navigateFallback: null,
        globPatterns: ['**/*.{css,js,svg,png,ico,txt,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache diary index pages (year and carnet) for offline
            urlPattern: /\/(cz|original|en|uk|fr)\/(\d{3}|\d{4})\/?$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'diary-entries-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 90
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache section-based entries (e.g., /original/000/000-01/)
            urlPattern: /\/(cz|original|en|uk|fr)\/\d{3}\/\d{3}-\d{2}\/?$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'diary-entries-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 90
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache diary entries for offline reading (also used by offline download feature).
            // Allows date-suffixed IDs like 1877-01-07-09 or 1878-10-04-evening.
            urlPattern: /\/(cz|original|en|uk|fr)\/\d{3}\/\d{4}-\d{2}-\d{2}[^/]*\/?$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'diary-entries-cache',
              expiration: {
                maxEntries: 5000,
                maxAgeSeconds: 60 * 60 * 24 * 90 // 90 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache JSON data files (filter index, offline freshness manifest)
            // so the filter and offline-status UIs keep working offline.
            urlPattern: /\/data\/[^/]+\.json$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'diary-data-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      },
      experimental: {
        directoryAndTrailingSlashHandler: true
      }
    })
  ]
});