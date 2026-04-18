import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/profile', '/menu'];

// Public routes that don't require authentication
const publicRoutes = ['/', '/login', '/register', '/home', '/oauth2-redirect', '/forgot-password-email', '/reset-password-email'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if current route is protected
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/api');

    // Get JWT token from cookies
    const token = request.cookies.get('jwtToken')?.value;

    // If accessing protected route without token, redirect to login
    if (isProtectedRoute && !token) {
        const loginUrl = new URL('/', request.url);
        return NextResponse.redirect(loginUrl);
    }

    // If accessing login page with valid token, redirect to home
    if (pathname === '/' && token) {
        const homeUrl = new URL('/home', request.url);
        return NextResponse.redirect(homeUrl);
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
