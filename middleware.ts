import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuth = !!token;
  const { pathname } = request.nextUrl;

  // Skip static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/home' ||
    pathname.startsWith('/teamlane') ||
    pathname.startsWith('/animat') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg')
  ) {
    return NextResponse.next();
  }

  // Handle root path - allow access to landing page
  if (pathname === '/') {
    return NextResponse.next();
  }

  // Handle auth routes - allow unauthenticated access
  if (pathname.startsWith('/auth')) {
    // If already authenticated and trying to access signin/signup, redirect to team selection
    if (isAuth && (pathname === '/auth/signin' || pathname === '/auth/signup')) {
      return NextResponse.redirect(new URL('/team-selection', request.url));
    }
    return NextResponse.next();
  }

  // Handle old auth routes - redirect to new ones
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }
  if (pathname === '/register') {
    return NextResponse.redirect(new URL('/auth/signup', request.url));
  }

  // Handle legal pages - allow unauthenticated access
  if (pathname.startsWith('/legal') || pathname.startsWith('/terms') || pathname.startsWith('/privacy')) {
    return NextResponse.next();
  }

  // Handle protected routes
  if (!isAuth) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};