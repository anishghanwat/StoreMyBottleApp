import apiClient from './api';
import { Profile, ProfileUpdateRequest, User } from '../types/api.types';

export const profileService = {
    async getProfile(): Promise<Profile> {
        const response = await apiClient.get<Profile>('/profile');
        return response.data;
    },

    async updateProfile(data: ProfileUpdateRequest): Promise<User> {
        const response = await apiClient.put<User>('/profile', data);
        localStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
    },

    async uploadAvatar(file: File): Promise<User> {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post<User>('/profile/upload-avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        localStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
    },
};
