import { getSignInUrl } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  if (!process.env.WORKOS_API_KEY || !process.env.WORKOS_CLIENT_ID) {
    return NextResponse.redirect(new URL('/login?error=unconfigured', request.url));
  }

  try {
    const signInUrl = await getSignInUrl();
    return NextResponse.redirect(signInUrl);
  } catch (error) {
    console.error('WorkOS getSignInUrl error:', error);
    return NextResponse.redirect(new URL('/login?error=auth_error', request.url));
  }
}
