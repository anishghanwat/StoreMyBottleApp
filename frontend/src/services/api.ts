import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { sessionManager } from '../utils/session';

// Use environment variable for API URL, fallback to auto-detect for local dev
const getApiUrl = () => {
    // Check if VITE_API_URL is set (production)
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    // Fallback for local development
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:8000';
    }

    // Default fallback
    return 'http://localhost:8000';
};

const API_URL = getApiUrl();

// Create axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Subscribe to token refresh
const subscribeTokenRefresh = (cb: (token: string) => void) => {
    refreshSubscribers.push(cb);
};

// Notify all subscribers when token is refreshed
const onTokenRefreshed = (token: string) => {
    refreshSubscribers.forEach(cb => cb(token));
    refreshSubscribers = [];
};

// Refresh access token
const refreshAccessToken = async (): Promise<string | null> => {
    const refreshToken = sessionManager.getRefreshToken();
    if (!refreshToken) return null;

    try {
        const response = await axios.post(`${API_URL}/api/auth/refresh`, { refresh_token: refreshToken });
        const { access_token, refresh_token: new_refresh_token, user } = response.data;

        // Save new session
        sessionManager.saveSession(access_token, new_refresh_token, user);

        return access_token;
    } catch (error) {
        // Refresh failed, clear session
        sessionManager.clearSession();
        window.location.href = '/login';
        return null;
    }
};

// Request interceptor to add auth token and auto-refresh
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        // Check if token needs refresh
        if (sessionManager.shouldRefreshToken() && !isRefreshing) {
            isRefreshing = true;
            const newToken = await refreshAccessToken();
            isRefreshing = false;

            if (newToken) {
                onTokenRefreshed(newToken);
            }
        }

        const token = sessionManager.getAccessToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest: any = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Wait for token refresh to complete
                return new Promise((resolve) => {
                    subscribeTokenRefresh((token: string) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(axios(originalRequest));
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const newToken = await refreshAccessToken();
            isRefreshing = false;

            if (newToken) {
                onTokenRefreshed(newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return axios(originalRequest);
            } else {
                // Refresh failed, redirect to login
                sessionManager.clearSession();
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
