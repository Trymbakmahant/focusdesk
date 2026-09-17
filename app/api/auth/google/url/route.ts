import { NextRequest, NextResponse } from 'next/server';
import { getGoogleConsentUrl, isGoogleConfigured } from '@/lib/googleCalendar';

export async function GET(request: NextRequest) {
  if (!isGoogleConfigured()) {
    return NextResponse.json(
      {
        error: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local',
        isConfigured: false,
      },
      { status: 400 }
    );
  }

  const authUrl = getGoogleConsentUrl();

  const redirectParam = request.nextUrl.searchParams.get('redirect');
  if (redirectParam === 'true') {
    return NextResponse.redirect(authUrl);
  }

  return NextResponse.json({ url: authUrl, isConfigured: true });
}
