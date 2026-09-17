import { NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { getStoredGoogleTokens, isGoogleConfigured } from '@/lib/googleCalendar';
import { getUserGoogleTokens } from '@/lib/calendarService';

export async function GET() {
  const configured = isGoogleConfigured();

  let connected = false;
  try {
    const { user } = await withAuth();
    if (user?.id) {
      const userTokens = await getUserGoogleTokens(user.id);
      if (userTokens?.accessToken) {
        connected = true;
      }
    }
  } catch {
    // Session check error or unauthenticated
  }

  if (!connected) {
    const tokens = await getStoredGoogleTokens();
    connected = Boolean(tokens && tokens.access_token);
  }

  return NextResponse.json({
    isConnected: connected,
    isConfigured: configured,
  });
}
