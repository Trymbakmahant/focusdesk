import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

/**
 * FocusDeck Robots Policy
 *
 * Configures crawler access for standard search engines and AI bots.
 * Separates search indexing crawlers (e.g. OAI-SearchBot) from foundation model
 * training scrapers (GPTBot).
 */
export default function robots(): MetadataRoute.Robots {
  const privateDisallows = [
    '/api/',
    '/auth/',
    '/callback',
    '/login',
    '/_next/',
  ];

  return {
    rules: [
      // Standard search engine crawlers (Google, Bing, DuckDuckGo, etc.)
      {
        userAgent: '*',
        allow: '/',
        disallow: privateDisallows,
      },
      // OpenAI Search Crawler (powers citations & answers in ChatGPT Search)
      {
        userAgent: 'OAI-SearchBot',
        allow: [
          '/',
          '/focus',
          '/tasks',
          '/calendar',
          '/activity',
          '/reminders',
          '/llms.txt',
        ],
        disallow: privateDisallows,
      },
      // OpenAI Training Crawler (foundation model pre-training scraping)
      // Maintained as a separate policy for fine-grained control
      {
        userAgent: 'GPTBot',
        allow: [
          '/',
          '/focus',
          '/tasks',
          '/calendar',
          '/activity',
          '/reminders',
          '/llms.txt',
        ],
        disallow: privateDisallows,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
