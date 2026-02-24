import axios from 'axios';

// Auto-detect API URL based on environment
// All connections use HTTPS now (backend has SSL)
const getApiUrl = () => {
    const hostname = window.location.hostname;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Accessing from same machine - use https
        return 'https://localhost:8000/api';
    } else {
        // Accessing from network (phone, etc.) - use https
        return `https://${hostname}:8000/api`;
    }
};

const API_URL = getApiUrl();

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('bartender_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('bartender_token');
            localStorage.removeItem('bartender');
            if (window.location.pathname !== '/') {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export const authService = {
    login: async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },

    validateQR: async (qrToken: string) => {
        const response = await api.post('/redemptions/validate', { qr_token: qrToken });
        return response.data;
    },

    signup: async (name: string, email: string, password: string, phone: string) => {
        const response = await api.post('/auth/signup', { name, email, password, phone });
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

