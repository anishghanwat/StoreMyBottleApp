import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Auto-detect API URL based on environment
// Always use HTTPS for backend (required for camera access)
const getApiUrl = () => {
    const hostname = window.location.hostname;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Accessing from same machine - use https
        return 'https://localhost:8000';
    } else {
        // Accessing from network - use https
        return `https://${hostname}:8000`;
    }
};

const API_URL = getApiUrl();

// Create axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('access_token');
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
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default apiClient;
