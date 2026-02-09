import apiClient from './api';
import {
    GoogleLoginRequest,
    PhoneSendOTPRequest,
    PhoneVerifyOTPRequest,
    TokenResponse,
    User,
} from '../types/api.types';

export const authService = {
    // Simple email/password login (for MVP)
    async login(email: string, password: string, name?: string): Promise<TokenResponse> {
        try {
            const response = await apiClient.post<TokenResponse>('/auth/login', {
                email,
                password,
            });

            // Store token and user
            localStorage.setItem('access_token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

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

        // Store token and user
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        return response.data;
    },

    // Google OAuth login
    async googleLogin(token: string): Promise<TokenResponse> {
        const response = await apiClient.post<TokenResponse>('/auth/google', {
            token,
        } as GoogleLoginRequest);

        // Store token and user
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

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

        // Store token and user
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        return response.data;
    },

    // Get current user
    async getCurrentUser(): Promise<User> {
        const response = await apiClient.get<User>('/auth/me');
        localStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
    },

    // Logout
    logout(): void {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
    },

    // Get stored user
    getStoredUser(): User | null {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    // Check if authenticated
    isAuthenticated(): boolean {
        return !!localStorage.getItem('access_token');
    },
};
