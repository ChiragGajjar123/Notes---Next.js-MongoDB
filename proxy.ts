import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Auth proxy — protects routes by checking the NextAuth JWT session cookie.
 * Redirects unauthenticated users to /auth/signin for protected routes.
 * Redirects authenticated users away from auth pages back to /.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for NextAuth JWT session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token;

  // Auth pages — redirect authenticated users to home
  if (pathname.startsWith('/auth/')) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Protected routes — redirect unauthenticated users to sign in
  if (!isAuthenticated) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - /api/auth/* (NextAuth API — must be publicly accessible)
     * - /_next/static (static files)
     * - /_next/image (image optimization)
     * - /favicon.ico, /icon.svg (icons)
     */
    '/((?!api/auth|_next/static|_next/image|favicon\\.ico|icon\\.svg).*)',
  ],
};
