import apiClient from './api';
import {
    Redemption,
    RedemptionCreateRequest,
    QRValidationRequest,
    QRValidationResponse,
} from '../types/api.types';

export const redemptionService = {
    // Create a new redemption
    async createRedemption(purchaseId: string, pegSize: number): Promise<Redemption> {
        const response = await apiClient.post<Redemption>('/redemptions/generate-qr', {
            purchase_id: purchaseId,
            peg_size_ml: pegSize,
        } as RedemptionCreateRequest);
        return response.data;
    },

    // Validate QR code
    async validateQR(qrToken: string): Promise<QRValidationResponse> {
        const response = await apiClient.post<QRValidationResponse>(
            '/redemptions/validate',
            {
                qr_token: qrToken,
            } as QRValidationRequest
        );
        return response.data;
    },

    async getRedemptionHistory(): Promise<Redemption[]> {
        const response = await apiClient.get<{ redemptions: Redemption[]; total: number }>(
            '/redemptions/history'
        );
        return response.data.redemptions;
    },

    // Get redemption status
    async getRedemptionStatus(id: string): Promise<Redemption> {
        const response = await apiClient.get<Redemption>(`/redemptions/${id}`);
        return response.data;
    }
};
