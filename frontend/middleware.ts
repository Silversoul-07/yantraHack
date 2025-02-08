import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get token from cookies (adjust the cookie name if needed)
  const token = request.cookies.get("access_token")?.value;
  console.log(token)
  const { pathname } = request.nextUrl;

  // Bypass middleware for static files or API routes
  if (pathname.startsWith('/_next/') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // If no token is set and not already on the /welcome page, redirect to /welcome
  if (!token && pathname !== '/welcome') {
    const url = request.nextUrl.clone();
    url.pathname = '/welcome';
    return NextResponse.redirect(url);
  }

  // If token is set and user is on /welcome, redirect to root page
  if (token && pathname === '/welcome') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|auth|assets|favicon.ico).*)"],
};