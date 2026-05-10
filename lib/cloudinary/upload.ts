import axios from 'axios';
import { getAuthHeader } from '../auth/auth-utils';
import { API_URL } from '../api/client';

interface SignatureData {
  signature: string;
  timestamp: string;
  apiKey: string;
  cloudName: string;
  folder: string;
}

export async function generateSignature(folder = 'DtaAssigment'): Promise<SignatureData> {
  const token = getAuthHeader();
  const res = await axios.post(
    `${API_URL}/api/images/signature`,
    { folder },
    { headers: { Authorization: token } }
  );
  if (!res.data.success) {
    throw new Error(res.data.message || 'Failed to generate signature');
  }
  return res.data.data;
}

export async function uploadImageToCloudinary(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const sig = await generateSignature();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('signature', sig.signature);
  formData.append('timestamp', sig.timestamp);
  formData.append('api_key', sig.apiKey);
  formData.append('folder', sig.folder);

  const xhr = new XMLHttpRequest();

  return new Promise((resolve, reject) => {
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const resp = JSON.parse(xhr.responseText);
          resolve(resp.secure_url);
        } catch {
          reject(new Error('Invalid response from Cloudinary'));
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Upload request failed')));
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`);
    xhr.send(formData);
  });
}
