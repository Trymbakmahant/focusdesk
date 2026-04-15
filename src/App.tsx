import React from 'react';
import ClientLayout from '@/app/ClientLayout';
import Home from '@/app/page';
import TasksPage from '@/app/tasks/page';
import CalendarPage from '@/app/calendar/page';
import FocusPage from '@/app/focus/page';
import RemindersPage from '@/app/reminders/page';
import ActivityPage from '@/app/activity/page';
import SecondBrainPage from '@/app/second-brain/page';
import LoginPage from '@/app/login/page';
import AuthCallbackPage from '@/app/auth/callback/page';
import { usePathname } from '@/src/shims/next-navigation';

export default function App() {
  const pathname = usePathname();

  const renderContent = () => {
    switch (pathname) {
      case '/login':
        return <LoginPage />;
      case '/auth/callback':
      case '/callback':
        return <AuthCallbackPage />;
      case '/tasks':
        return <TasksPage />;
      case '/calendar':
        return <CalendarPage />;
      case '/focus':
        return <FocusPage />;
      case '/reminders':
        return <RemindersPage />;
      case '/activity':
        return <ActivityPage />;
      case '/second-brain':
        return <SecondBrainPage />;
      default:
        return <Home />;
    }
  };

  return (
    <ClientLayout>
      {renderContent()}
    </ClientLayout>
  );
}
