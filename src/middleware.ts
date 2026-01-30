import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const { pathname } = request.nextUrl;

  // Define public paths that don't require authentication
  const publicPaths = ['/login'];

  // Check if the current path is public
  const isPublicPath = publicPaths.includes(pathname);

  // 1. If user is NOT logged in and tries to access a protected route
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. If user IS logged in and tries to access /login
  if (token && isPublicPath) {
    return NextResponse.redirect(new URL('/admin/books', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
