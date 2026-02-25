// Session management utilities for admin frontend

const TOKEN_KEY = 'admin_token';
const REFRESH_TOKEN_KEY = 'admin_refresh_token';
const USER_KEY = 'admin_user';
const TOKEN_EXPIRY_KEY = 'admin_token_expiry';

// Token expires in 30 minutes (backend setting)
const TOKEN_EXPIRY_MS = 30 * 60 * 1000;

// Refresh token 5 minutes before expiry
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

export const sessionManager = {
    // Save session data
    saveSession: (accessToken: string, refreshToken: string, user: any) => {
        localStorage.setItem(TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        localStorage.setItem(USER_KEY, JSON.stringify(user));

        // Set expiry time
        const expiryTime = Date.now() + TOKEN_EXPIRY_MS;
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    },

    // Get access token
    getAccessToken: (): string | null => {
        return localStorage.getItem(TOKEN_KEY);
    },

    // Get refresh token
    getRefreshToken: (): string | null => {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    },

    // Get user data
    getUser: (): any | null => {
        const userStr = localStorage.getItem(USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    },

    // Check if token is expired or about to expire
    shouldRefreshToken: (): boolean => {
        const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
        if (!expiryStr) return true;

        const expiryTime = parseInt(expiryStr);
        const now = Date.now();

        // Refresh if token expires in less than 5 minutes
        return (expiryTime - now) < REFRESH_BUFFER_MS;
    },

    // Clear session data
    clearSession: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
    },

    // Check if user is logged in
    isLoggedIn: (): boolean => {
        return !!localStorage.getItem(TOKEN_KEY) && !!localStorage.getItem(REFRESH_TOKEN_KEY);
    }
};
