import { getSignInUrl } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

export const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
export const GOOGLE_CALENDAR_READONLY_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

export async function GET(request: NextRequest) {
  if (!process.env.WORKOS_API_KEY || !process.env.WORKOS_CLIENT_ID) {
    return NextResponse.redirect(new URL('/login?error=unconfigured', request.url));
  }

  try {
    // Request prompt: 'consent' so Google prompts for permissions even if basic profile was previously authorized
    const signInUrl = await getSignInUrl({ prompt: 'consent' });
    const url = new URL(signInUrl);

    // Pass provider_scopes with Google Calendar events scope when requested at login time
    const requestCalendar = request.nextUrl.searchParams.get('calendar') !== 'false';
    if (requestCalendar) {
      url.searchParams.set('provider_scopes', GOOGLE_CALENDAR_SCOPE);
      url.searchParams.append('provider_scopes', GOOGLE_CALENDAR_READONLY_SCOPE);
      url.searchParams.set('prompt', 'consent');
      url.searchParams.set('provider_query_params[prompt]', 'consent');
      url.searchParams.set('provider_query_params[access_type]', 'offline');
    }

    return NextResponse.redirect(url.toString());
  } catch (error) {
    console.error('WorkOS getSignInUrl error:', error);
    return NextResponse.redirect(new URL('/login?error=auth_error', request.url));
  }
}
