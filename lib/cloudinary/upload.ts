'use client';

import { getAuthHeader } from '../auth/auth-utils';
import { API_URL } from '../api/client';

/**
 * Upload image via backend (multipart). Uses JWT — avoids Cloudinary signed-upload 401
 * when browser params/signature do not match server signing.
 */
export async function uploadImageViaBackend(
    file: File,
    onProgress?: (percent: number) => void,
): Promise<string> {
    const auth = getAuthHeader();
    if (!auth) {
        throw new Error('Bạn cần đăng nhập để tải ảnh lên.');
    }

    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && onProgress) {
                onProgress(Math.round((e.loaded / e.total) * 100));
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const json = JSON.parse(xhr.responseText);
                    const url = json?.data?.url as string | undefined;
                    if (!url) {
                        reject(new Error(json?.message || 'Không nhận được URL ảnh từ server'));
                        return;
                    }
                    resolve(url);
                } catch {
                    reject(new Error('Phản hồi server không hợp lệ'));
                }
            } else if (xhr.status === 401) {
                reject(
                    new Error(
                        'Không có quyền tải ảnh hoặc phiên đăng nhập đã hết hạn (401).',
                    ),
                );
            } else {
                let msg = `Tải ảnh thất bại (${xhr.status})`;
                try {
                    const json = JSON.parse(xhr.responseText);
                    if (json?.message) msg = json.message;
                } catch {
                    /* ignore */
                }
                reject(new Error(msg));
            }
        });

        xhr.addEventListener('error', () => reject(new Error('Lỗi mạng khi tải ảnh')));
        xhr.addEventListener('abort', () => reject(new Error('Đã hủy tải ảnh')));

        xhr.open('POST', `${API_URL}/api/images/upload`);
        xhr.setRequestHeader('Authorization', auth);
        xhr.send(formData);
    });
}
