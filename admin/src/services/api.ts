

import axios from 'axios';
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

const api = axios.create({
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

// Handle 401 errors globally - try to refresh token
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
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/api/auth/login', { email, password });
        const { access_token, refresh_token, user } = response.data;

        // Save session
        sessionManager.saveSession(access_token, refresh_token, user);

        return response.data;
    },

    getProfile: async () => {
        const response = await api.get('/api/users/me');
        return response.data;
    },

    logout: async () => {
        const refreshToken = sessionManager.getRefreshToken();
        if (refreshToken) {
            try {
                await api.post('/api/auth/logout', { refresh_token: refreshToken });
            } catch (error) {
                console.error('Logout error:', error);
            }
        }
        sessionManager.clearSession();
    },

    logoutAllDevices: async () => {
        try {
            await api.post('/api/auth/logout-all');
        } catch (error) {
            console.error('Logout all devices error:', error);
        }
        sessionManager.clearSession();
    },

    getSessions: async () => {
        const response = await api.get('/api/auth/sessions');
        return response.data;
    },

    forgotPassword: async (email: string) => {
        const response = await api.post('/api/auth/forgot-password', { email });
        return response.data;
    },

    resetPassword: async (token: string, newPassword: string) => {
        const response = await api.post('/api/auth/reset-password', {
            token,
            new_password: newPassword
        });
        return response.data;
    },

    verifyResetToken: async (token: string) => {
        const response = await api.post('/api/auth/verify-reset-token', { token });
        return response.data;
    }
};

export const adminService = {
    getStats: async () => {
        const response = await api.get('/api/admin/stats');
        return response.data;
    },

    getUsers: async (skip = 0, limit = 50) => {
        const response = await api.get(`/api/admin/users?skip=${skip}&limit=${limit}`);
        return response.data;
    },

    updateUserRole: async (userId, role, venueId) => {
        const response = await api.put(`/api/admin/users/${userId}/role`, {
            role,
            venue_id: venueId
        });
        return response.data;
    },

    createVenue: async (venueData) => {
        const response = await api.post('/api/admin/venues', venueData);
        return response.data;
    },

    getVenues: async () => {
        const response = await api.get('/api/admin/venues');
        return response.data;
    },

    updateVenue: async (id, venueData) => {
        const response = await api.put(`/api/admin/venues/${id}`, venueData);
        return response.data;
    },

    deleteVenue: async (id) => {
        const response = await api.delete(`/api/admin/venues/${id}`);
        return response.data;
    },

    getBottles: async (venueId?: string) => {
        const params = venueId ? `?venue_id=${venueId}` : '';
        const response = await api.get(`/api/admin/bottles${params}`);
        return response.data;
    },

    getBottle: async (bottleId: string) => {
        const response = await api.get(`/api/admin/bottles/${bottleId}`);
        return response.data;
    },

    createBottle: async (bottleData) => {
        const response = await api.post('/api/admin/bottles', bottleData);
        return response.data;
    },

    updateBottle: async (bottleId: string, bottleData) => {
        const response = await api.put(`/api/admin/bottles/${bottleId}`, bottleData);
        return response.data;
    },

    deleteBottle: async (bottleId: string) => {
        const response = await api.delete(`/api/admin/bottles/${bottleId}`);
        return response.data;
    },

    getPurchases: async (filters?: { status?: string; venue_id?: string; user_id?: string }) => {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.venue_id) params.append('venue_id', filters.venue_id);
        if (filters?.user_id) params.append('user_id', filters.user_id);

        const queryString = params.toString();
        const response = await api.get(`/api/admin/purchases${queryString ? '?' + queryString : ''}`);
        return response.data;
    },

    getPurchase: async (purchaseId: string) => {
        const response = await api.get(`/api/admin/purchases/${purchaseId}`);
        return response.data;
    },

    getRedemptions: async (filters?: { status?: string; venue_id?: string; user_id?: string }) => {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.venue_id) params.append('venue_id', filters.venue_id);
        if (filters?.user_id) params.append('user_id', filters.user_id);

        const queryString = params.toString();
        const response = await api.get(`/api/admin/redemptions${queryString ? '?' + queryString : ''}`);
        return response.data;
    },

    getRedemption: async (redemptionId: string) => {
        const response = await api.get(`/api/admin/redemptions/${redemptionId}`);
        return response.data;
    },

    // Bartender Management
    getBartenders: async (venueId?: string) => {
        const params = venueId ? `?venue_id=${venueId}` : '';
        const response = await api.get(`/api/admin/bartenders${params}`);
        return response.data;
    },

    getBartender: async (bartenderId: string) => {
        const response = await api.get(`/api/admin/bartenders/${bartenderId}`);
        return response.data;
    },

    createBartender: async (bartenderData: any) => {
        const response = await api.post('/api/admin/bartenders', bartenderData);
        return response.data;
    },

    updateBartender: async (bartenderId: string, bartenderData: any) => {
        const response = await api.put(`/api/admin/bartenders/${bartenderId}`, bartenderData);
        return response.data;
    },

    deleteBartender: async (bartenderId: string) => {
        const response = await api.delete(`/api/admin/bartenders/${bartenderId}`);
        return response.data;
    },

    // Analytics
    getRevenueAnalytics: async (filters?: { start_date?: string; end_date?: string; venue_id?: string }) => {
        const params = new URLSearchParams();
        if (filters?.start_date) params.append('start_date', filters.start_date);
        if (filters?.end_date) params.append('end_date', filters.end_date);
        if (filters?.venue_id) params.append('venue_id', filters.venue_id);

        const queryString = params.toString();
        const response = await api.get(`/api/admin/analytics/revenue${queryString ? '?' + queryString : ''}`);
        return response.data;
    },

    getSalesAnalytics: async (filters?: { start_date?: string; end_date?: string; venue_id?: string }) => {
        const params = new URLSearchParams();
        if (filters?.start_date) params.append('start_date', filters.start_date);
        if (filters?.end_date) params.append('end_date', filters.end_date);
        if (filters?.venue_id) params.append('venue_id', filters.venue_id);

        const queryString = params.toString();
        const response = await api.get(`/api/admin/analytics/sales${queryString ? '?' + queryString : ''}`);
        return response.data;
    },

    getRedemptionAnalytics: async (filters?: { start_date?: string; end_date?: string; venue_id?: string }) => {
        const params = new URLSearchParams();
        if (filters?.start_date) params.append('start_date', filters.start_date);
        if (filters?.end_date) params.append('end_date', filters.end_date);
        if (filters?.venue_id) params.append('venue_id', filters.venue_id);

        const queryString = params.toString();
        const response = await api.get(`/api/admin/analytics/redemptions${queryString ? '?' + queryString : ''}`);
        return response.data;
    },

    getUserAnalytics: async (filters?: { start_date?: string; end_date?: string }) => {
        const params = new URLSearchParams();
        if (filters?.start_date) params.append('start_date', filters.start_date);
        if (filters?.end_date) params.append('end_date', filters.end_date);

        const queryString = params.toString();
        const response = await api.get(`/api/admin/analytics/users${queryString ? '?' + queryString : ''}`);
        return response.data;
    },

    // Reports
    getRevenueReport: async (filters?: { start_date?: string; end_date?: string; venue_id?: string }) => {
        const params = new URLSearchParams();
        if (filters?.start_date) params.append('start_date', filters.start_date);
        if (filters?.end_date) params.append('end_date', filters.end_date);
        if (filters?.venue_id) params.append('venue_id', filters.venue_id);

        const queryString = params.toString();
        const response = await api.get(`/api/admin/reports/revenue${queryString ? '?' + queryString : ''}`);
        return response.data;
    },

    getSalesReport: async (filters?: { start_date?: string; end_date?: string; venue_id?: string }) => {
        const params = new URLSearchParams();
        if (filters?.start_date) params.append('start_date', filters.start_date);
        if (filters?.end_date) params.append('end_date', filters.end_date);
        if (filters?.venue_id) params.append('venue_id', filters.venue_id);

        const queryString = params.toString();
        const response = await api.get(`/api/admin/reports/sales${queryString ? '?' + queryString : ''}`);
        return response.data;
    },

    getInventoryReport: async (filters?: { venue_id?: string }) => {
        const params = new URLSearchParams();
        if (filters?.venue_id) params.append('venue_id', filters.venue_id);

        const queryString = params.toString();
        const response = await api.get(`/api/admin/reports/inventory${queryString ? '?' + queryString : ''}`);
        return response.data;
    },

    getUserActivityReport: async (filters?: { start_date?: string; end_date?: string }) => {
        const params = new URLSearchParams();
        if (filters?.start_date) params.append('start_date', filters.start_date);
        if (filters?.end_date) params.append('end_date', filters.end_date);

        const queryString = params.toString();
        const response = await api.get(`/api/admin/reports/user-activity${queryString ? '?' + queryString : ''}`);
        return response.data;
    },

    // Venue Analytics
    getVenueComparison: async (filters?: { start_date?: string; end_date?: string }) => {
        const params = new URLSearchParams();
        if (filters?.start_date) params.append('start_date', filters.start_date);
        if (filters?.end_date) params.append('end_date', filters.end_date);

        const queryString = params.toString();
        const response = await api.get(`/api/admin/analytics/venues/comparison${queryString ? '?' + queryString : ''}`);
        return response.data;
    },

    getVenueDetailedAnalytics: async (venueId: string, filters?: { start_date?: string; end_date?: string }) => {
        const params = new URLSearchParams();
        if (filters?.start_date) params.append('start_date', filters.start_date);
        if (filters?.end_date) params.append('end_date', filters.end_date);

        const queryString = params.toString();
        const response = await api.get(`/api/admin/analytics/venues/${venueId}${queryString ? '?' + queryString : ''}`);
        return response.data;
    },

    // Promotions
    getPromotions: async (filters?: { status?: string; venue_id?: string }) => {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.venue_id) params.append('venue_id', filters.venue_id);

        const queryString = params.toString();
        const response = await api.get(`/api/admin/promotions${queryString ? '?' + queryString : ''}`);
        return response.data;
    },

    getPromotion: async (promotionId: string) => {
        const response = await api.get(`/api/admin/promotions/${promotionId}`);
        return response.data;
    },

    createPromotion: async (promotionData: any) => {
        const response = await api.post('/api/admin/promotions', promotionData);
        return response.data;
    },

    updatePromotion: async (promotionId: string, promotionData: any) => {
        const response = await api.put(`/api/admin/promotions/${promotionId}`, promotionData);
        return response.data;
    },

    deletePromotion: async (promotionId: string) => {
        const response = await api.delete(`/api/admin/promotions/${promotionId}`);
        return response.data;
    },

    validatePromotion: async (validationData: any) => {
        const response = await api.post('/api/admin/promotions/validate', validationData);
        return response.data;
    },

    // Support Tickets
    getTickets: async (filters?: { status?: string; category?: string; priority?: string; assigned_to_id?: string }) => {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.category) params.append('category', filters.category);
        if (filters?.priority) params.append('priority', filters.priority);
        if (filters?.assigned_to_id) params.append('assigned_to_id', filters.assigned_to_id);

        const queryString = params.toString();
        const response = await api.get(`/api/admin/tickets${queryString ? '?' + queryString : ''}`);
        return response.data;
    },

    getTicket: async (ticketId: string) => {
        const response = await api.get(`/api/admin/tickets/${ticketId}`);
        return response.data;
    },

    createTicket: async (ticketData: any) => {
        const response = await api.post('/api/admin/tickets', ticketData);
        return response.data;
    },

    updateTicket: async (ticketId: string, ticketData: any) => {
        const response = await api.put(`/api/admin/tickets/${ticketId}`, ticketData);
        return response.data;
    },

    deleteTicket: async (ticketId: string) => {
        const response = await api.delete(`/api/admin/tickets/${ticketId}`);
        return response.data;
    },

    addTicketComment: async (ticketId: string, commentData: any) => {
        const response = await api.post(`/api/admin/tickets/${ticketId}/comments`, commentData);
        return response.data;
    },

    // ============ Audit Logs ============
    getAuditLogs: async (filters?: {
        user_id?: string;
        action?: string;
        entity_type?: string;
        start_date?: string;
        end_date?: string;
        skip?: number;
        limit?: number;
    }) => {
        const params = new URLSearchParams();
        if (filters?.user_id) params.append('user_id', filters.user_id);
        if (filters?.action) params.append('action', filters.action);
        if (filters?.entity_type) params.append('entity_type', filters.entity_type);
        if (filters?.start_date) params.append('start_date', filters.start_date);
        if (filters?.end_date) params.append('end_date', filters.end_date);
        if (filters?.skip !== undefined) params.append('skip', filters.skip.toString());
        if (filters?.limit !== undefined) params.append('limit', filters.limit.toString());

        const queryString = params.toString();
        const response = await api.get(`/api/admin/audit-logs${queryString ? '?' + queryString : ''}`);
        return response.data;
    },

    // ============ System Settings ============
    getSettings: async (filters?: { category?: string; is_public?: boolean }) => {
        const params = new URLSearchParams();
        if (filters?.category) params.append('category', filters.category);
        if (filters?.is_public !== undefined) params.append('is_public', filters.is_public.toString());

        const queryString = params.toString();
        const response = await api.get(`/api/admin/settings${queryString ? '?' + queryString : ''}`);
        return response.data;
    },

    getSetting: async (settingKey: string) => {
        const response = await api.get(`/api/admin/settings/${settingKey}`);
        return response.data;
    },

    createSetting: async (settingData: any) => {
        const response = await api.post('/api/admin/settings', settingData);
        return response.data;
    },

    updateSetting: async (settingKey: string, settingData: any) => {
        const response = await api.put(`/api/admin/settings/${settingKey}`, settingData);
        return response.data;
    },

    bulkUpdateSettings: async (settings: any[]) => {
        const response = await api.post('/api/admin/settings/bulk-update', { settings });
        return response.data;
    },

    deleteSetting: async (settingKey: string) => {
        const response = await api.delete(`/api/admin/settings/${settingKey}`);
        return response.data;
    }
};

export default api;
