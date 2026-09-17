import type { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo';

export const metadata: Metadata = constructMetadata({
  title: 'Task Checklist & Priority Organizer',
  description:
    'Organize daily work items, prioritize urgent tasks with custom tags, track completion progress, and streamline productivity on Fixates.',
  path: '/tasks',
});

export default function TasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
