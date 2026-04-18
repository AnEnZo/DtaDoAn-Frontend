import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getAuthHeader } from '../auth/auth-utils';

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

// Response interceptor to handle 401 Unauthorized
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid - could redirect to login
            // For now, just pass the error through
            console.warn('Unauthorized request - token may be expired');
        }
        return Promise.reject(error);
    }
);

export default apiClient;
export { API_URL };
