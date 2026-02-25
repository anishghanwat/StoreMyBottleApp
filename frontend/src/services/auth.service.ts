import apiClient from './api';
import { sessionManager } from '../utils/session';
import {
    GoogleLoginRequest,
    PhoneSendOTPRequest,
    PhoneVerifyOTPRequest,
    TokenResponse,
    User,
} from '../types/api.types';

// Auth service for customer frontend
export const authService = {
    // Simple email/password login (for MVP)
    async login(email: string, password: string, name?: string): Promise<TokenResponse> {
        try {
            const response = await apiClient.post<TokenResponse>('/auth/login', {
                email,
                password,
            });

            // Store tokens and user using session manager
            if (response.data.refresh_token) {
                sessionManager.saveSession(
                    response.data.access_token,
                    response.data.refresh_token,
                    response.data.user
                );
            }

            return response.data;
        } catch (error) {
            // If login fails and name is provided, try signup
            if (name) {
                return this.signup(email, password, name);
            }
            throw error;
        }
    },

    // Signup method
    async signup(email: string, password: string, name: string): Promise<TokenResponse> {
        const response = await apiClient.post<TokenResponse>('/auth/signup', {
            email,
            password,
            name,
        });

        // Store tokens and user using session manager
        if (response.data.refresh_token) {
            sessionManager.saveSession(
                response.data.access_token,
                response.data.refresh_token,
                response.data.user
            );
        }

        return response.data;
    },

    // Google OAuth login
    async googleLogin(token: string): Promise<TokenResponse> {
        const response = await apiClient.post<TokenResponse>('/auth/google', {
            token,
        } as GoogleLoginRequest);

        // Store tokens and user using session manager
        if (response.data.refresh_token) {
            sessionManager.saveSession(
                response.data.access_token,
                response.data.refresh_token,
                response.data.user
            );
        }

        return response.data;
    },

    // Send OTP to phone
    async sendOTP(phone: string): Promise<{ message: string }> {
        const response = await apiClient.post('/auth/phone/send-otp', {
            phone,
        } as PhoneSendOTPRequest);
        return response.data;
    },

    // Verify OTP
    async verifyOTP(phone: string, otpCode: string): Promise<TokenResponse> {
        const response = await apiClient.post<TokenResponse>('/auth/phone/verify-otp', {
            phone,
            otp_code: otpCode,
        } as PhoneVerifyOTPRequest);

        // Store tokens and user using session manager
        if (response.data.refresh_token) {
            sessionManager.saveSession(
                response.data.access_token,
                response.data.refresh_token,
                response.data.user
            );
        }

        return response.data;
    },

    // Refresh access token
    async refreshToken(): Promise<TokenResponse> {
        const refreshToken = sessionManager.getRefreshToken();
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await apiClient.post<TokenResponse>('/auth/refresh', {
            refresh_token: refreshToken,
        });

        // Store new tokens using session manager
        if (response.data.refresh_token) {
            sessionManager.saveSession(
                response.data.access_token,
                response.data.refresh_token,
                response.data.user
            );
        }

        return response.data;
    },

    // Get current user
    async getCurrentUser(): Promise<User> {
        const response = await apiClient.get<User>('/auth/me');
        const user = sessionManager.getUser();
        if (user) {
            sessionManager.saveSession(
                sessionManager.getAccessToken() || '',
                sessionManager.getRefreshToken() || '',
                response.data
            );
        }
        return response.data;
    },

    // Logout
    logout(): void {
        sessionManager.clearSession();
    },

    // Get stored user
    getStoredUser(): User | null {
        return sessionManager.getUser();
    },

    // Check if authenticated
    isAuthenticated(): boolean {
        return sessionManager.isLoggedIn();
    },

    // Forgot password - request reset email
    async forgotPassword(email: string): Promise<{ message: string; success: boolean }> {
        const response = await apiClient.post('/auth/forgot-password', { email });
        return response.data;
    },

    // Reset password with token
    async resetPassword(token: string, newPassword: string): Promise<{ message: string; success: boolean }> {
        const response = await apiClient.post('/auth/reset-password', {
            token,
            new_password: newPassword
        });
        return response.data;
    },

    // Verify reset token is valid
    async verifyResetToken(token: string): Promise<boolean> {
        try {
            await apiClient.post(`/auth/verify-reset-token?token=${token}`);
            return true;
        } catch {
            return false;
        }
    },
};
