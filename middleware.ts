import { NextRequest, NextResponse, NextFetchEvent } from 'next/server';
import { authkitMiddleware } from '@workos-inc/authkit-nextjs';

const isWorkOSConfigured = Boolean(
  process.env.WORKOS_CLIENT_ID &&
  process.env.WORKOS_API_KEY &&
  process.env.WORKOS_COOKIE_PASSWORD
);

const authkitHandler = isWorkOSConfigured
  ? authkitMiddleware({
      redirectUri: process.env.WORKOS_REDIRECT_URI || 'http://localhost:3000/callback',
    })
  : null;

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (!authkitHandler) {
    return NextResponse.next();
  }

  return authkitHandler(request, event);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets like images (.png, .jpg, .svg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
