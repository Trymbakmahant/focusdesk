import type { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo';

export const metadata: Metadata = constructMetadata({
  title: 'Sign In to Fixates',
  description: 'Sign in to access your personal Fixates workspace, tasks, habits, and focus sessions.',
  path: '/login',
  noIndex: true,
});

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
