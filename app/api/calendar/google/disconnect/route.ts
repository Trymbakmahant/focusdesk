import { NextResponse } from 'next/server';
import { clearGoogleTokens } from '@/lib/googleCalendar';

export async function POST() {
  await clearGoogleTokens();
  return NextResponse.json({ success: true });
}
