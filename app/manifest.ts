import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Fixates — your personal command center for work, focus, and time.',
    short_name: 'Fixates',
    description:
      'Fixates is your personal command center for work, focus, and time. An all-in-one macOS desktop dashboard featuring deep-work timers, calendar sync, and smart task management.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f1117',
    theme_color: '#8b5cf6',
    orientation: 'any',
    icons: [
      {
        src: '/logo.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
        purpose: 'maskable',
      },
      {
        src: '/logo.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
        purpose: 'any',
      },
    ],
  };
}
