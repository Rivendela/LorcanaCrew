import { NextRequest, NextResponse } from 'next/server';
import { PIN_COOKIE_NAME } from './lib/constants';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow Next.js internals, static files, and the PIN verification routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/pin') ||
    pathname === '/pin' ||
    pathname === '/favicon.ico' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check if PIN gate cookie is present and verified
  const pinCookie = request.cookies.get(PIN_COOKIE_NAME)?.value;

  if (pinCookie !== 'verified') {
    const pinUrl = new URL('/pin', request.url);
    return NextResponse.redirect(pinUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
