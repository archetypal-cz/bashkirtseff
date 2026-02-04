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
  site: 'https://bashkirtseff.aretea.cz',

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
        name: 'Deník Marie Bashkirtseff',
        short_name: 'Bashkirtseff',
        description: 'Kompletní, necenzurovaný deník Marie Bashkirtseff',
        theme_color: '#B45309',
        background_color: '#FFF8F0',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        navigateFallback: null,
        globPatterns: ['**/*.{css,js,html,svg,png,ico,txt,woff,woff2}'],
        // Exclude large glossary index from precaching (3+ MB)
        globIgnores: ['**/glossary/index.html', '**/cz/glossary/index.html'],
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
            // Cache diary entries for offline reading
            urlPattern: /\/(cz|original)\/\d+\/\d{4}-\d{2}-\d{2}\/?$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'diary-entries-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false,
        navigateFallbackAllowlist: [/^\//]
      },
      experimental: {
        directoryAndTrailingSlashHandler: true
      }
    })
  ]
});