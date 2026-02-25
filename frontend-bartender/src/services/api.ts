import axios from 'axios';
import { sessionManager } from '../utils/session';

// Use environment variable for API URL, fallback to auto-detect for local dev
const getApiUrl = () => {
    // Check if VITE_API_URL is set (production)
    if (import.meta.env.VITE_API_URL) {
        return `${import.meta.env.VITE_API_URL}/api`;
    }

    // Fallback for local development
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:8000/api';
    }

    // Default fallback
    return 'http://localhost:8000/api';
};

const API_URL = getApiUrl();

export const api = axios.create({
    baseURL: API_URL,
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
        const response = await axios.post(`${API_URL.replace('/api', '')}/api/auth/refresh`, { refresh_token: refreshToken });
        const { access_token, refresh_token: new_refresh_token, user } = response.data;

        // Save new session
        sessionManager.saveSession(access_token, new_refresh_token, user);

        return access_token;
    } catch (error) {
        // Refresh failed, clear session
        sessionManager.clearSession();
        window.location.href = '/';
        return null;
    }
};

// Add token to requests and auto-refresh if needed
api.interceptors.request.use(async (config) => {
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
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 errors - try to refresh token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

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
                if (window.location.pathname !== '/') {
                    window.location.href = '/';
                }
            }
        }
        return Promise.reject(error);
    }
);

export const authService = {
    login: async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        const { access_token, refresh_token, user } = response.data;

        // Save session
        sessionManager.saveSession(access_token, refresh_token, user);

        return response.data;
    },

    validateQR: async (qrToken: string) => {
        const response = await api.post('/redemptions/validate', { qr_token: qrToken });
        return response.data;
    },

    signup: async (name: string, email: string, password: string, phone: string) => {
        const response = await api.post('/auth/signup', { name, email, password, phone });
        const { access_token, refresh_token, user } = response.data;

        // Save session
        sessionManager.saveSession(access_token, refresh_token, user);

        return response.data;
    },

    logout: async () => {
        const refreshToken = sessionManager.getRefreshToken();
        if (refreshToken) {
            try {
                await api.post('/auth/logout', { refresh_token: refreshToken });
            } catch (error) {
                console.error('Logout error:', error);
            }
        }
        sessionManager.clearSession();
    },

    forgotPassword: async (email: string) => {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },

    resetPassword: async (token: string, newPassword: string) => {
        const response = await api.post('/auth/reset-password', { token, new_password: newPassword });
        return response.data;
    },

    verifyResetToken: async (token: string) => {
        const response = await api.post('/auth/verify-reset-token', { token });
        return response.data;
    }
};

export const venueService = {
    getStats: async (venueId: string) => {
        const response = await api.get(`/venues/${venueId}/stats`);
        return response.data;
    },
    getBottles: async (venueId: string) => {
        const response = await api.get(`/venues/${venueId}/bottles`);
        return response.data;
    }
};

export const purchaseService = {
    getPending: async (venueId: string) => {
        const response = await api.get(`/purchases/venue/${venueId}/pending`);
        return response.data;
    },
    process: async (purchaseId: string, action: 'confirm' | 'reject') => {
        const response = await api.post(`/purchases/${purchaseId}/process`, { action });
        return response.data;
    },
    getDetails: async (purchaseId: string) => {
        const response = await api.get(`/purchases/${purchaseId}`);
        return response.data;
    }
};

export const redemptionService = {
    getHistory: async (venueId: string, limit: number = 10) => {
        const response = await api.get(`/redemptions/venue/${venueId}/recent?limit=${limit}`);
        return response.data;
    },
    getFullHistory: async (venueId: string, status?: string) => {
        let url = `/redemptions/venue/${venueId}/history`;
        if (status) url += `?status=${status}`;
        const response = await api.get(url);
        return response.data;
    },
    validate: async (qrToken: string) => {
        const response = await api.post('/redemptions/validate', { qr_token: qrToken });
        return response.data;
    }
};

export const profileService = {
    getProfile: async () => {
        const response = await api.get('/profile');
        return response.data;
    },
    getUserBottles: async (userId: string) => {
        const response = await api.get(`/profile/${userId}/bottles`);
        return response.data;
    }
};

export const promotionService = {
    getActivePromotions: async (venueId?: string) => {
        if (!venueId) {
            return { promotions: [], total: 0 };
        }
        // Use public venue endpoint instead of admin endpoint
        const response = await api.get(`/venues/${venueId}/promotions?limit=5`);
        return response.data;
    },
    validatePromotion: async (code: string, purchaseId: string) => {
        const response = await api.post('/admin/promotions/validate', {
            code,
            purchase_id: purchaseId
        });
        return response.data;
    }
};

