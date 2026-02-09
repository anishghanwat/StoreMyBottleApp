import axios from 'axios';

const API_URL = 'https://192.168.31.5:8000/api';

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
    }
};
