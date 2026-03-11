import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'mc-auth';

// Public paths that don't require auth
const PUBLIC_PATHS = ['/login', '/api/auth', '/_next', '/favicon.ico'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check auth cookie exists (value is verified at the route level for sensitive ops)
  const authCookie = request.cookies.get(COOKIE_NAME);
  if (!authCookie?.value) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
