import { handleAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

const authHandler = handleAuth({
  returnPathname: '/',
});

export async function GET(request: NextRequest) {
  if (!process.env.WORKOS_API_KEY || !process.env.WORKOS_CLIENT_ID || !process.env.WORKOS_COOKIE_PASSWORD) {
    return NextResponse.redirect(new URL('/login?error=unconfigured', request.url));
  }
  return authHandler(request);
}
