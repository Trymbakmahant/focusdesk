import { NextRequest, NextResponse } from 'next/server';
import { getOAuth2Client, saveGoogleTokens } from '@/lib/googleCalendar';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const error = request.nextUrl.searchParams.get('error');

  const origin = request.nextUrl.origin;

  if (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(`${origin}/calendar?google_error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/calendar?google_error=no_code_provided`);
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    await saveGoogleTokens(tokens as Record<string, unknown>);

    return NextResponse.redirect(`${origin}/calendar?google_sync=success`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'token_exchange_failed';
    console.error('Failed to exchange Google OAuth code for tokens:', err);
    return NextResponse.redirect(`${origin}/calendar?google_error=${encodeURIComponent(msg)}`);
  }
}
