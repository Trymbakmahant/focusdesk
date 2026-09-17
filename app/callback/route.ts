import { handleAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { storeUserGoogleTokens } from '@/lib/calendarService';

const authHandler = handleAuth({
  returnPathname: '/',
  onSuccess: async ({ user, oauthTokens }) => {
    // Extract Google tokens from WorkOS response and store them encrypted, associated with WorkOS user ID
    if (oauthTokens?.accessToken && user?.id) {
      try {
        await storeUserGoogleTokens(user.id, {
          accessToken: oauthTokens.accessToken,
          refreshToken: oauthTokens.refreshToken,
          expiresAt: oauthTokens.expiresAt,
          scopes: oauthTokens.scopes,
        });
      } catch (err) {
        console.error('Failed to store encrypted Google OAuth tokens:', err);
      }
    }
  },
});

export async function GET(request: NextRequest) {
  if (!process.env.WORKOS_API_KEY || !process.env.WORKOS_CLIENT_ID || !process.env.WORKOS_COOKIE_PASSWORD) {
    return NextResponse.redirect(new URL('/login?error=unconfigured', request.url));
  }
  return authHandler(request);
}
