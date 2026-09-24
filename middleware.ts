import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuth = !!token;
  const { pathname, searchParams } = request.nextUrl;
  const signinBase = process.env.NEXT_PUBLIC_SIGNIN_URL || 'https://signin.grafene.in';
  const originHost = `https://${request.headers.get('host') || 'teamlane.grafene.in'}`;

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

  // Redirect auth pages to central signin.grafene.in service
  if (
    pathname === '/auth/signin' ||
    pathname === '/auth/signup' ||
    pathname === '/auth/forgot-password' ||
    pathname === '/auth/reset-password' ||
    pathname === '/auth/verify-otp' ||
    pathname === '/login' ||
    pathname === '/register'
  ) {
    if (isAuth) {
      return NextResponse.redirect(new URL('/teams', request.url));
    }

    const currentCallback = searchParams.get('callbackUrl');
    let callbackUrl: string;
    if (!currentCallback || currentCallback === '/') {
      callbackUrl = `${originHost}/teams`;
    } else if (currentCallback.startsWith('/')) {
      callbackUrl = `${originHost}${currentCallback}`;
    } else {
      callbackUrl = currentCallback;
    }

    const targetPath = (pathname === '/login' || pathname === '/register') ? '/auth/signin' : pathname;
    const targetUrl = new URL(targetPath, signinBase);
    targetUrl.searchParams.set('callbackUrl', callbackUrl);

    searchParams.forEach((value, key) => {
      if (key !== 'callbackUrl') {
        targetUrl.searchParams.set(key, value);
      }
    });

    return NextResponse.redirect(targetUrl, 307);
  }

  // Handle root path - allow access to landing page
  if (pathname === '/') {
    return NextResponse.next();
  }

  // Handle legal pages - allow unauthenticated access
  if (pathname.startsWith('/legal') || pathname.startsWith('/terms') || pathname.startsWith('/privacy')) {
    return NextResponse.next();
  }

  // Handle protected routes - redirect unauthenticated users to central signin
  if (!isAuth) {
    const callbackUrl = `${originHost}${pathname}${request.nextUrl.search}`;
    const redirectUrl = new URL('/auth/signin', signinBase);
    redirectUrl.searchParams.set('callbackUrl', callbackUrl);
    return NextResponse.redirect(redirectUrl, 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};