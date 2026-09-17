import type { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo';

export const metadata: Metadata = constructMetadata({
  title: 'Interactive Calendar & Timeline Schedule',
  description:
    'Sync seamlessly with Google Calendar and Apple ICS feeds. View day schedules, upcoming meetings, finished events, and timeline agenda in Fixates.',
  path: '/calendar',
});

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
