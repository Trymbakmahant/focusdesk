import { getSignUpUrl } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  if (!process.env.WORKOS_API_KEY || !process.env.WORKOS_CLIENT_ID) {
    return NextResponse.redirect(new URL('/login?error=unconfigured', request.url));
  }

  try {
    const signUpUrl = await getSignUpUrl();
    return NextResponse.redirect(signUpUrl);
  } catch (error) {
    console.error('WorkOS getSignUpUrl error:', error);
    return NextResponse.redirect(new URL('/login?error=auth_error', request.url));
  }
}
