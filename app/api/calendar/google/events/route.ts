import { NextResponse } from 'next/server';
import { getAuthenticatedCalendar, formatGoogleCalendarEvent, isGoogleConfigured } from '@/lib/googleCalendar';
import { CalendarEvent } from '@/types/calendar';

export async function GET() {
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
      events: [],
    });
  }

  try {
    // Pull events from 30 days in the past through 90 days in future
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
    const message = err instanceof Error ? err.message : 'failed_to_fetch_events';
    return NextResponse.json(
      {
        isConnected: false,
        isConfigured: true,
        events: [],
        error: message,
      },
      { status: 500 }
    );
  }
}
