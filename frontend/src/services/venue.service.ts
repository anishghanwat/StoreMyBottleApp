import apiClient from './api';
import { Venue, Bottle } from '../types/api.types';

export const venueService = {
    // Get all venues
    // Get all venues with optional search
    async getVenues(search?: string): Promise<Venue[]> {
        const params = search ? { search } : {};
        const response = await apiClient.get<{ venues: Venue[]; total: number }>('/venues', { params });
        return response.data.venues;
    },

    // Get venue by ID
    async getVenueById(id: string): Promise<Venue> {
        const response = await apiClient.get<Venue>(`/venues/${id}`);
        return response.data;
    },

    // Get bottles for a venue
    async getBottlesByVenue(venueId: string): Promise<Bottle[]> {
        const response = await apiClient.get<{ bottles: Bottle[]; total: number }>(
            `/venues/${venueId}/bottles`
        );
        return response.data.bottles;
    },
};
