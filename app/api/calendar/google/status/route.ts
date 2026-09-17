import { NextResponse } from 'next/server';
import { getStoredGoogleTokens, isGoogleConfigured } from '@/lib/googleCalendar';

export async function GET() {
  const configured = isGoogleConfigured();
  const tokens = await getStoredGoogleTokens();
  const connected = Boolean(tokens && tokens.access_token);

  return NextResponse.json({
    isConnected: connected,
    isConfigured: configured,
  });
}
