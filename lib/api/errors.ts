// Centralized error parsing/formatting for backend responses.
//
// The backend returns a consistent JSON error contract:
//   { timestamp, status, error, message, path }
// served as application/json. This module turns any backend error (or thrown
// Error) into a clean, user-facing Vietnamese message, and never leaks a raw
// stack trace or a giant blob to the UI.

const MAX_MESSAGE_LENGTH = 300;

/** Known backend (often English) messages mapped to friendly Vietnamese text. */
const MESSAGE_TRANSLATIONS: { match: string; vi: string }[] = [
    { match: 'Only served orders can be paid', vi: 'Chỉ đơn hàng đã phục vụ mới có thể thanh toán' },
    { match: 'Only SERVED orders can be paid', vi: 'Chỉ đơn hàng đã phục vụ mới có thể thanh toán' },
    { match: 'Order already paid', vi: 'Đơn hàng này đã được thanh toán' },
    { match: 'Voucher already used', vi: 'Mã voucher này đã được sử dụng' },
    { match: 'Voucher expired', vi: 'Mã voucher đã hết hạn' },
    { match: 'Voucher is inactive', vi: 'Mã voucher không còn hoạt động' },
];

/** Strip leading Java exception class names from a message. */
function cleanJavaException(message: string): string {
    return message
        .replace(/^(java\.[\w.]+|jakarta\.[\w.]+|org\.springframework\.[\w.]+)(Exception|Error)?:\s*/g, '')
        .replace(/^[\w.]+(Exception|Error):\s*/g, '')
        .trim();
}

/** Translate a known backend message, or return it cleaned/truncated. */
function normalizeMessage(raw: string | null | undefined, fallback: string): string {
    if (!raw) return fallback;
    let message = raw.trim();
    if (!message) return fallback;

    for (const { match, vi } of MESSAGE_TRANSLATIONS) {
        if (message.includes(match)) return vi;
    }

    message = cleanJavaException(message);
    if (!message) return fallback;
    if (message.length > MAX_MESSAGE_LENGTH) {
        message = message.slice(0, MAX_MESSAGE_LENGTH) + '…';
    }
    return message;
}

/** Error carrying the HTTP status, thrown by the shared HTTP wrapper. */
export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

/**
 * Read a friendly message out of a failed fetch Response. Reads the body as
 * text once, then attempts JSON.parse; works whether the backend returns a
 * JSON error object or plain text, and never throws.
 */
export async function extractErrorMessage(res: Response, defaultMessage = 'Đã có lỗi xảy ra'): Promise<string> {
    let text = '';
    try {
        text = await res.text();
    } catch {
        return defaultMessage;
    }

    let candidate = text;
    try {
        const json = JSON.parse(text);
        candidate = json?.message || json?.error || text;
    } catch {
        // body was not JSON; keep raw text
    }

    return normalizeMessage(candidate, defaultMessage);
}

/**
 * Turn anything caught in a catch block into a friendly message.
 * Handles ApiError, Error, and plain strings/objects.
 */
export function getErrorMessage(err: unknown, defaultMessage = 'Đã có lỗi xảy ra'): string {
    if (err instanceof ApiError) {
        return normalizeMessage(err.message, defaultMessage);
    }
    if (err instanceof Error) {
        return normalizeMessage(err.message, defaultMessage);
    }
    if (typeof err === 'string') {
        return normalizeMessage(err, defaultMessage);
    }
    return defaultMessage;
}
