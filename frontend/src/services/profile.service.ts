import apiClient from './api';
import { Profile, ProfileUpdateRequest, User } from '../types/api.types';

export const profileService = {
    // Get user profile with stats
    async getProfile(): Promise<Profile> {
        const response = await apiClient.get<Profile>('/profile');
        return response.data;
    },

    // Update user profile
    async updateProfile(data: ProfileUpdateRequest): Promise<User> {
        const response = await apiClient.put<User>('/profile', data);
        localStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
    },
};
