import { NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { getUserCalendarEvents, NoGoogleTokensError } from '@/lib/calendarService';
import { getAuthenticatedCalendar, formatGoogleCalendarEvent, isGoogleConfigured } from '@/lib/googleCalendar';
import { CalendarEvent } from '@/types/calendar';

export async function GET() {
  // 1. Check if user is authenticated via WorkOS
  let workosUserId: string | null = null;
  try {
    const auth = await withAuth();
    if (auth.user?.id) {
      workosUserId = auth.user.id;
    }
  } catch {
    // Unauthenticated or local session
  }

  // 2. If user is authenticated with WorkOS, fetch calendar events using stored Google tokens
  if (workosUserId) {
    try {
      const events = await getUserCalendarEvents(workosUserId);
      return NextResponse.json({
        isConnected: true,
        isConfigured: true,
        events,
      });
    } catch (err: unknown) {
      if (err instanceof NoGoogleTokensError) {
        // User logged in via non-Google method (or without calendar scopes): surface clear fallback
        return NextResponse.json({
          isConnected: false,
          isConfigured: isGoogleConfigured(),
          requiresConnection: true,
          events: [],
          message: 'No Google Calendar connected for this user account. Please connect your Google Calendar.',
        });
      }

      console.error('Error fetching calendar events for user:', workosUserId, err);
      return NextResponse.json(
        {
          isConnected: false,
          isConfigured: true,
          events: [],
          error: err instanceof Error ? err.message : 'failed_to_fetch_events',
        },
        { status: 500 }
      );
    }
  }

  // 3. Fallback for cookie-based authentication or standalone OAuth
  if (!isGoogleConfigured()) {
    return NextResponse.json({
      isConnected: false,
      isConfigured: false,
      events: [],
      error: 'Google Cloud OAuth is not configured in environment.',
    });
  }

  const calendar = await getAuthenticatedCalendar();
  if (!calendar) {
    return NextResponse.json({
      isConnected: false,
      isConfigured: true,
      requiresConnection: true,
      events: [],
      message: 'No Google Calendar connected. Please connect your Google Calendar account.',
    });
  }

  try {
    const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const items = response.data.items || [];
    const formatted: CalendarEvent[] = items
      .map(formatGoogleCalendarEvent)
      .filter((e): e is CalendarEvent => e !== null);

    return NextResponse.json({
      isConnected: true,
      isConfigured: true,
      events: formatted,
    });
  } catch (err: unknown) {
    console.error('Failed to list Google Calendar events:', err);
    return NextResponse.json(
      {
        isConnected: false,
        isConfigured: true,
        events: [],
        error: err instanceof Error ? err.message : 'failed_to_fetch_events',
      },
      { status: 500 }
    );
  }
}
