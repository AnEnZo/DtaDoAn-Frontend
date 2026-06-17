import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getAuthHeader, removeToken } from '../auth/auth-utils';

// Get API URL from environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Create axios instance with base URL
const apiClient: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add JWT token
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const authHeader = getAuthHeader();
        if (authHeader && config.headers) {
            config.headers.Authorization = authHeader;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle 401 Unauthorized:
// clear the (likely expired) token and bounce to the login page.
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
            removeToken();
            if (window.location.pathname !== '/') {
                const current = window.location.pathname + window.location.search;
                window.location.href = `/?session=expired&redirect=${encodeURIComponent(current)}`;
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
export { API_URL };
