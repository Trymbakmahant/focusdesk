import { NextResponse } from 'next/server';

export async function GET() {
  const isConfigured = Boolean(
    process.env.WORKOS_CLIENT_ID &&
    process.env.WORKOS_API_KEY &&
    process.env.WORKOS_COOKIE_PASSWORD
  );
  return NextResponse.json({ isConfigured });
}
