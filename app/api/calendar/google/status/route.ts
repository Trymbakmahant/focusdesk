import { NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { getStoredGoogleTokens, isGoogleConfigured } from '@/lib/googleCalendar';
import { getUserGoogleTokens, hasCalendarScope } from '@/lib/calendarService';

export async function GET() {
  const configured = isGoogleConfigured();

  let connected = false;
  let hasTokensWithoutCalendarScope = false;

  try {
    const { user } = await withAuth();
    if (user?.id) {
      const userTokens = await getUserGoogleTokens(user.id);
      if (userTokens?.accessToken) {
        if (hasCalendarScope(userTokens)) {
          connected = true;
        } else {
          hasTokensWithoutCalendarScope = true;
        }
      }
    }
  } catch {
    // Session check error or unauthenticated
  }

  if (!connected) {
    const tokens = await getStoredGoogleTokens();
    if (tokens && tokens.access_token) {
      connected = true;
    }
  }

  return NextResponse.json({
    isConnected: connected,
    isConfigured: configured,
    requiresCalendarConsent: hasTokensWithoutCalendarScope && !connected,
    requiresConnection: !connected,
  });
}
