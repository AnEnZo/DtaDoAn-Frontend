import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { parseJwt } from '@/lib/auth/auth-utils';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/profile', '/menu'];

// Public routes that don't require authentication
const publicRoutes = ['/', '/login', '/register', '/home', '/oauth2-redirect', '/forgot-password-email', '/reset-password-email'];

// Route mappings based on roles
const roleRedirects: Record<string, string> = {
  'ROLE_ADMIN': '/dashboard',
  'ADMIN': '/dashboard',
  'ROLE_STAFF': '/home',
  'STAFF': '/home',
  'ROLE_USER': '/home',
  'USER': '/home',
};

/**
 * Decode JWT token to get payload
 */
function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    // Base64url decode
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = Buffer.from(padded, 'base64').toString('utf-8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Get user's primary role from token
 */
function getUserRole(payload: Record<string, unknown>): string | null {
  // Check for roles array
  const roles = payload.roles as string[] | undefined;
  if (roles && roles.length > 0) {
    // Return first role that matches our redirects
    for (const role of roles) {
      if (role in roleRedirects) {
        return role;
      }
    }
    return roles[0]; // Return first role if no match
  }

  // Check for single role field
  const role = payload.role as string | undefined;
  if (role) return role;

  return null;
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip middleware for static files and API routes
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/favicon') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // Check if current route is protected
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    const isPublicRoute = publicRoutes.includes(pathname);

    // Get JWT token from cookies
    const token = request.cookies.get('jwtToken')?.value;

    // If accessing protected route without token, redirect to login
    if (isProtectedRoute && !token) {
        const loginUrl = new URL('/', request.url);
        // Store intended destination for post-login redirect
        loginUrl.searchParams.set('redirect', pathname);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.set('redirect_uri', pathname, { path: '/', maxAge: 300 });
        return response;
    }

    // If accessing login page with valid token, smart redirect based on role
    if (pathname === '/' && token) {
        const payload = decodeJwt(token);

        if (payload) {
            const role = getUserRole(payload);

            // Redirect based on role
            if (role && role in roleRedirects) {
                const redirectUrl = new URL(roleRedirects[role], request.url);
                return NextResponse.redirect(redirectUrl);
            }
        }

        // Fallback to home if no role found
        const homeUrl = new URL('/home', request.url);
        return NextResponse.redirect(homeUrl);
    }

    // Check for stored redirect URI (from protected route redirect)
    const storedRedirect = request.cookies.get('redirect_uri')?.value;
    if (storedRedirect && pathname === '/home') {
        // User just logged in, redirect to stored destination
        const redirectUrl = new URL(storedRedirect, request.url);
        const response = NextResponse.redirect(redirectUrl);
        response.cookies.delete('redirect_uri');
        return response;
    }

    return NextResponse.next();
}

// Configure which routes should run the middleware
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
