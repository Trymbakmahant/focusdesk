import { NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import {
  getUserCalendarEvents,
  NoGoogleTokensError,
  InsufficientCalendarScopeError,
} from '@/lib/calendarService';
import { getAuthenticatedCalendar, formatGoogleCalendarEvent, isGoogleConfigured } from '@/lib/googleCalendar';
import { CalendarEvent } from '@/types/calendar';

function isAuthOrScopeError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  if (err instanceof NoGoogleTokensError || err instanceof InsufficientCalendarScopeError) return true;
  const anyErr = err as any;
  if (anyErr.code === 403 || anyErr.status === 403 || anyErr.code === 401 || anyErr.status === 401) return true;
  const msg = String(anyErr.message || '').toLowerCase();
  return (
    msg.includes('insufficient') ||
    msg.includes('scope') ||
    msg.includes('invalid credentials') ||
    msg.includes('not connected')
  );
}

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
      console.warn('WorkOS Google Calendar fetch warning:', err instanceof Error ? err.message : err);

      // Attempt fallback to direct Google OAuth if WorkOS token had insufficient scopes
      try {
        const standaloneCalendar = await getAuthenticatedCalendar();
        if (standaloneCalendar) {
          const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          const timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

          const response = await standaloneCalendar.events.list({
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
        }
      } catch {
        // Fallback failed, continue to permission requirement response
      }

      if (isAuthOrScopeError(err)) {
        return NextResponse.json({
          isConnected: false,
          isConfigured: isGoogleConfigured(),
          requiresConnection: true,
          requiresCalendarConsent: true,
          events: [],
          message: 'Google Calendar permissions required. Please connect or authorize your Google Calendar.',
        });
      }

      console.error('Unexpected error fetching calendar events for user:', workosUserId, err);
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
    if (isAuthOrScopeError(err)) {
      return NextResponse.json({
        isConnected: false,
        isConfigured: true,
        requiresConnection: true,
        requiresCalendarConsent: true,
        events: [],
        message: 'Google Calendar permissions required. Please reconnect Google Calendar.',
      });
    }

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
