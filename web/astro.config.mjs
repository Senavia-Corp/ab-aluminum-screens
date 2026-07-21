// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// EN at /, ES at /es/, mirrored slugs. Static output + one on-demand /api/lead route.
export default defineConfig({
  site: 'https://www.abaluminumandscreens.com',
  output: 'static',
  adapter: vercel(),
  trailingSlash: 'never',
  build: { format: 'directory' },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },
  // 301s from old Webflow URLs -> new routes.
  redirects: {
    '/request-estimate': '/contact-us',
    '/es/request-estimate': '/es/contact-us',
    '/services/pergolas-patio-covers': '/aluminum-pergolas',
    '/services/motorized-louvered-roof-systems': '/louvered-roof-system',
    '/services/pool-sceen-enclosures': '/pool-enclosure',
    '/services/patio-screen-rooms': '/patio-screens',
    '/aluminum-pergolas.html': '/aluminum-pergolas',
    '/pool-enclosure.html': '/pool-enclosure',
    '/patio-screens.html': '/patio-screens',
    '/louvered-roof-system.html': '/louvered-roof-system',
    '/about-us.html': '/about-us',
    '/contact-us.html': '/contact-us',
    '/reviews.html': '/reviews',
    '/blog.html': '/blog',
    '/our-work.html': '/our-work',
    '/thank-you.html': '/thank-you',
    '/gallery/pergolas.html': '/gallery/pergolas',
    '/gallery/pool-enclosure.html': '/gallery/pool-enclosure',
    '/gallery/patio-screens.html': '/gallery/patio-screens',
    '/gallery/louvered-roof-systems.html': '/gallery/louvered-roof-systems',
  },
  integrations: [
    sitemap({
      // thank-you pages are noindex conversion confirmations — keep them out of the sitemap too.
      filter: (page) => !/\/thank-you\/?$/.test(page),
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', es: 'es' },
      },
    }),
  ],
});
