// Shared HTTP wrapper around fetch.
//
// Responsibilities:
//  - prepend the API base URL
//  - attach the JWT Authorization header
//  - ALWAYS check res.ok before parsing, and turn failures into a typed
//    ApiError carrying a friendly message (never a raw stack trace)
//  - centralize 401 handling: clear the token and bounce to the login page
//  - parse JSON safely (empty / 204 responses are handled)
//
// This is the single source of truth for talking to the backend. Prefer it
// over calling fetch() directly.

import { API_URL } from './client';
import { getAuthHeader, removeToken } from '../auth/auth-utils';
import { ApiError, extractErrorMessage } from './errors';

export interface RequestOptions extends Omit<RequestInit, 'body'> {
    /** Request body. Plain objects are JSON-stringified automatically. */
    body?: BodyInit | object | null;
    /** Attach the Authorization header (default: true). */
    auth?: boolean;
    /** Parse the response as JSON (default: true). Set false to get the raw Response (e.g. blobs/images). */
    parseJson?: boolean;
    /** Default message used when the backend body has none. */
    errorMessage?: string;
}

let redirectingForAuth = false;

/** Clear the session and bounce to the login page (browser only). */
function handleUnauthorized(): void {
    if (typeof window === 'undefined' || redirectingForAuth) return;
    removeToken();
    if (window.location.pathname !== '/') {
        redirectingForAuth = true;
        const current = window.location.pathname + window.location.search;
        window.location.href = `/?session=expired&redirect=${encodeURIComponent(current)}`;
    }
}

function isPlainObjectBody(body: unknown): boolean {
    return (
        body != null &&
        typeof body === 'object' &&
        !(body instanceof FormData) &&
        !(body instanceof URLSearchParams) &&
        !(body instanceof Blob) &&
        !(body instanceof ArrayBuffer)
    );
}

export async function request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
    const { body, auth = true, parseJson = true, errorMessage, headers, ...rest } = options;

    const url = path.startsWith('http') ? path : `${API_URL}${path}`;
    const finalHeaders = new Headers(headers as HeadersInit | undefined);

    if (auth) {
        const authHeader = getAuthHeader();
        if (authHeader) finalHeaders.set('Authorization', authHeader);
    }

    let finalBody: BodyInit | null | undefined;
    if (isPlainObjectBody(body)) {
        finalBody = JSON.stringify(body);
        if (!finalHeaders.has('Content-Type')) finalHeaders.set('Content-Type', 'application/json');
    } else {
        finalBody = body as BodyInit | null | undefined;
    }

    const res = await fetch(url, { ...rest, headers: finalHeaders, body: finalBody });

    if (!res.ok) {
        if (res.status === 401) handleUnauthorized();
        const message = await extractErrorMessage(res, errorMessage ?? 'Đã có lỗi xảy ra');
        throw new ApiError(message, res.status);
    }

    if (!parseJson) {
        return res as unknown as T;
    }

    if (res.status === 204) return undefined as T;
    const text = await res.text();
    if (!text) return undefined as T;
    try {
        return JSON.parse(text) as T;
    } catch {
        return text as unknown as T;
    }
}

export const apiGet = <T = unknown>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' });

export const apiPost = <T = unknown>(path: string, body?: RequestOptions['body'], options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body });

export const apiPut = <T = unknown>(path: string, body?: RequestOptions['body'], options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body });

export const apiPatch = <T = unknown>(path: string, body?: RequestOptions['body'], options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body });

export const apiDelete = <T = unknown>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' });
