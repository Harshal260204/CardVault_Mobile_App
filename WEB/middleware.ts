import { NextResponse } from 'next/server';

import { isPlatformSuperAdmin, isWebAdminRole } from '@/lib/roles';

import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login'];
const ADMIN_PREFIX = '/admin';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // BFF route handlers and proxy — never gate behind admin session middleware
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('cardvault_access_token')?.value;
  const role = request.cookies.get('cardvault_role')?.value;

  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(
        token && isWebAdminRole(role) ? '/admin/dashboard' : '/login',
        request.url,
      ),
    );
  }

  if (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  ) {
    if (token && pathname === '/login' && isWebAdminRole(role)) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    return NextResponse.next();
  }

  if (!token) {
    const login = new URL('/login', request.url);
    login.searchParams.set('from', pathname);
    return NextResponse.redirect(login);
  }

  if (!isWebAdminRole(role)) {
    return NextResponse.redirect(
      new URL('/login?error=admin_only', request.url),
    );
  }

  if (!pathname.startsWith(ADMIN_PREFIX)) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  // All /admin routes are for super admin now
  if (!isPlatformSuperAdmin(role)) {
    return NextResponse.redirect(new URL('/login?error=admin_only', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
