import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { getOAuth2Client, saveGoogleTokens } from '@/lib/googleCalendar';
import { storeUserGoogleTokens } from '@/lib/calendarService';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const error = request.nextUrl.searchParams.get('error');

  const origin = request.nextUrl.origin;

  if (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(`${origin}/?google_error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/?google_error=no_code_provided`);
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    // Save tokens in encrypted cookie
    await saveGoogleTokens(tokens as Record<string, unknown>);

    // If authenticated via WorkOS, also persist to WorkOS user token storage
    try {
      const auth = await withAuth();
      if (auth.user?.id && tokens.access_token) {
        await storeUserGoogleTokens(auth.user.id, {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || undefined,
          expiresAt: tokens.expiry_date || undefined,
          scopes: tokens.scope ? tokens.scope.split(' ') : [
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.readonly'
          ],
        });
      }
    } catch {
      // Ignore if user session check fails
    }

    return NextResponse.redirect(`${origin}/?google_sync=success`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'token_exchange_failed';
    console.error('Failed to exchange Google OAuth code for tokens:', err);
    return NextResponse.redirect(`${origin}/calendar?google_error=${encodeURIComponent(msg)}`);
  }
}
