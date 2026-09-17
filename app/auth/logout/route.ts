import { signOut } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await signOut();
  } catch (error) {
    console.error('WorkOS signOut error:', error);
  }
  return NextResponse.redirect(new URL('/login', request.url));
}
