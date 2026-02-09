import axios from 'axios';

// Use dynamic URL based on current hostname to support local network access
// FORCE HTTPS because backend is running with SSL
const protocol = 'https:';
const hostname = window.location.hostname;
const port = '8000'; // Backend port

const API_URL = import.meta.env.VITE_API_URL || `${protocol}//${hostname}:${port}`;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/api/auth/login', { email, password });
        return response.data;
    },

    getProfile: async () => {
        const response = await api.get('/api/users/me');
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
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

    createBottle: async (bottleData) => {
        const response = await api.post('/api/admin/bottles', bottleData);
        return response.data;
    }
};

export default api;
