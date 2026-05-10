'use client';

import Cookies from 'js-cookie';

export interface DecodedToken {
    sub?: string;
    displayName?: string;
    roles?: string[];
    exp?: number;
    [key: string]: unknown;
}

const TOKEN_KEY = 'jwtToken';

/**
 * Decode base64url string (JWT payload)
 */
function base64UrlDecode(input: string): string {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    try {
        return atob(padded);
    } catch {
        return '';
    }
}

/**
 * Parse JWT token to extract payload
 */
export function parseJwt(token: string): DecodedToken | null {
    try {
        const payload = token.split('.')[1];
        if (!payload) return null;

        const json = decodeURIComponent(
            Array.prototype.map
                .call(
                    base64UrlDecode(payload),
                    (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2),
                )
                .join(''),
        );
        return JSON.parse(json);
    } catch {
        return null;
    }
}

/**
 * Get JWT token from cookies
 */
export function getToken(): string | null {
    const token = Cookies.get(TOKEN_KEY);
    if (!token) return null;

    // Remove 'Bearer ' prefix if present
    return token.startsWith('Bearer ') ? token.slice(7) : token;
}

/**
 * Set JWT token in cookies
 * @param token - JWT token with or without 'Bearer ' prefix
 * @param  - Number of days before cookie expires (default: 7)
 */
export function setToken(token: string, expiresInDays: number = 7): void {
    // Remove 'Bearer ' prefix if present before storing
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;

    Cookies.set(TOKEN_KEY, cleanToken, {
        expires: expiresInDays,
        path: '/',
        sameSite: 'lax',
        // Note: For production with HTTPS, add: secure: true
    });
}

/**
 * Remove JWT token from cookies
 */
export function removeToken(): void {
    Cookies.remove(TOKEN_KEY, { path: '/' });
}

/**
 * Get user info from JWT token
 */
export function getUserFromToken(): DecodedToken | null {
    const token = getToken();
    if (!token) return null;
    return parseJwt(token);
}

/**
 * Get user roles from JWT token
 */
export function getRolesFromToken(): string[] {
    const user = getUserFromToken();
    return (user?.roles as string[] | undefined) ?? [];
}

/**
 * Check if user is authenticated (has valid token)
 */
export function isAuthenticated(): boolean {
    const token = getToken();
    if (!token) return false;

    const decoded = parseJwt(token);
    if (!decoded || !decoded.exp) return false;

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp > now;
}

/**
 * Get Authorization header value
 */
export function getAuthHeader(): string | null {
    const token = getToken();
    return token ? `Bearer ${token}` : null;
}
