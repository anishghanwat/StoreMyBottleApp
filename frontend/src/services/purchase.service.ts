import apiClient from './api';
import {
    Purchase,
    PurchaseCreateRequest,
    PurchaseConfirmRequest,
    UserBottle,
} from '../types/api.types';

export const purchaseService = {
    // Create a new purchase
    async createPurchase(bottleId: string, venueId: string): Promise<Purchase> {
        const response = await apiClient.post<Purchase>('/purchases', {
            bottle_id: bottleId,
            venue_id: venueId,
        } as PurchaseCreateRequest);
        return response.data;
    },

    // Get a specific purchase
    async getPurchase(purchaseId: string): Promise<Purchase> {
        const response = await apiClient.get<Purchase>(`/purchases/${purchaseId}`);
        return response.data;
    },

    // Confirm payment for a purchase
    async confirmPayment(
        purchaseId: string,
        paymentMethod: 'upi' | 'card'
    ): Promise<Purchase> {
        const response = await apiClient.post<Purchase>(
            `/purchases/${purchaseId}/confirm`,
            {
                payment_method: paymentMethod,
            } as PurchaseConfirmRequest
        );
        return response.data;
    },

    // Get user's bottles
    async getUserBottles(): Promise<UserBottle[]> {
        const response = await apiClient.get<{ bottles: UserBottle[]; total: number }>(
            '/purchases/my-bottles'
        );
        return response.data.bottles;
    },

    // Get purchase history
    async getPurchaseHistory(): Promise<UserBottle[]> {
        const response = await apiClient.get<{ bottles: UserBottle[]; total: number }>(
            '/purchases/history'
        );
        return response.data.bottles;
    },
};
