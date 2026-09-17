import type { Metadata } from 'next';

/**
 * FocusDeck Centralized SEO & LLM Discoverability Strategy
 * 
 * Supports dynamic production domain configuration with fallback to the current
 * Cloudflare deployment URL.
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://foucusing.xyz'
    : 'http://localhost:3000')
).replace(/\/$/, '');

export const SITE_CONFIG = {
  name: 'Fixates',
  legalName: 'Fixates Workspace',
  title: 'Fixates — your personal command center for work, focus, and time.',
  description:
    'Fixates is your personal command center for work, focus, and time. Featuring deep-work focus timers, Google & ICS calendar sync, priority task checklists, habit streak analytics, and AI agent voice automation.',
  shortDescription: 'Fixates — your personal command center for work, focus, and time.',
  applicationCategory: 'ProductivityApplication',
  operatingSystem: 'macOS, Modern Web Browsers',
  url: SITE_URL,
  ogImage: `${SITE_URL}/og-image.png`,
  logo: `${SITE_URL}/logo.jpg`,
  locale: 'en_US',
  keywords: [
    'Fixates',
    'command center for work focus and time',
    'macOS desktop dashboard',
    'productivity dashboard',
    'deep work timer',
    'Pomodoro timer macOS',
    'Google Calendar sync',
    'habit tracker',
    'task checklist',
    'Tauri desktop app',
    'developer productivity',
    'AI productivity harness',
    'focus workstation'
  ],
  author: {
    name: 'Fixates Team',
    url: SITE_URL,
  },
  creator: 'Fixates',
  publisher: 'Fixates',
};

/**
 * Generate type-safe page metadata inheriting from base config
 */
export function constructMetadata({
  title,
  description,
  path = '',
  image = SITE_CONFIG.ogImage,
  noIndex = false,
}: {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
} = {}): Metadata {
  const canonicalUrl = `${SITE_URL}${path}`;
  const pageTitle = title
    ? `${title} | ${SITE_CONFIG.name}`
    : SITE_CONFIG.title;
  const pageDescription = description || SITE_CONFIG.description;

  return {
    title: title ? { absolute: pageTitle } : SITE_CONFIG.title,
    description: pageDescription,
    keywords: SITE_CONFIG.keywords,
    authors: [{ name: SITE_CONFIG.author.name, url: SITE_CONFIG.author.url }],
    creator: SITE_CONFIG.creator,
    publisher: SITE_CONFIG.publisher,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      locale: SITE_CONFIG.locale,
      type: 'website',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${SITE_CONFIG.name} — Desktop Productivity Dashboard`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: [image],
      creator: '@fixates',
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
          nocache: false,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
  };
}

/**
 * Generates Schema.org structured data (JSON-LD) for WebSite and SoftwareApplication
 */
export function generateStructuredData() {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_CONFIG.name,
    description: SITE_CONFIG.shortDescription,
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: SITE_CONFIG.logo,
      },
    },
    inLanguage: 'en-US',
  };

  const softwareAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${SITE_URL}/#software`,
    name: SITE_CONFIG.name,
    url: SITE_URL,
    description: SITE_CONFIG.description,
    applicationCategory: SITE_CONFIG.applicationCategory,
    operatingSystem: SITE_CONFIG.operatingSystem,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    featureList: [
      'Interactive Pomodoro and customizable deep-work focus timer',
      'Full two-way Google Calendar and ICS schedule sync with timeline view',
      'Checklist task manager with importance badges and completion metrics',
      'Productivity streaks and habit activity tracking',
      'AI Agent tool harness and voice command navigation',
      'macOS native window mode powered by Tauri 2',
      'Dark mode Bento-grid and chronological feed view modes'
    ],
    screenshot: SITE_CONFIG.ogImage,
  };

  return {
    websiteSchema,
    softwareAppSchema,
  };
}
