import { getSignInUrl } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

export const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

export async function GET(request: NextRequest) {
  if (!process.env.WORKOS_API_KEY || !process.env.WORKOS_CLIENT_ID) {
    return NextResponse.redirect(new URL('/login?error=unconfigured', request.url));
  }

  try {
    const signInUrl = await getSignInUrl();
    const url = new URL(signInUrl);

    // Pass provider_scopes with Google Calendar events scope when requested at login time
    const requestCalendar = request.nextUrl.searchParams.get('calendar') !== 'false';
    if (requestCalendar) {
      url.searchParams.set('provider_scopes', GOOGLE_CALENDAR_SCOPE);
    }

    return NextResponse.redirect(url.toString());
  } catch (error) {
    console.error('WorkOS getSignInUrl error:', error);
    return NextResponse.redirect(new URL('/login?error=auth_error', request.url));
  }
}
