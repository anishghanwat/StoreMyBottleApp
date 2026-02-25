// API Type Definitions matching backend schemas

export interface Venue {
    id: string;
    name: string;
    location: string;
    is_open: boolean;
    image_url: string | null;
    created_at: string;
}

export interface Bottle {
    id: string;
    venue_id: string;
    brand: string;
    name: string;
    price: number;
    volume_ml: number;
    image_url: string | null;
    is_available: boolean;
}

export interface User {
    id: string;
    email: string | null;
    phone: string | null;
    name: string;
    created_at: string;
}

export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    user: User;
}

export interface Purchase {
    id: string;
    user_id: string;
    bottle_id: string;
    venue_id: string;
    total_ml: number;
    remaining_ml: number;
    purchase_price: number;
    payment_status: 'pending' | 'confirmed' | 'failed';
    payment_method: 'upi' | 'card' | 'cash' | null;
    purchased_at: string | null;
    created_at: string;
}

export interface UserBottle {
    id: string;
    bottleId: string;
    venueName: string;
    bottleName: string;
    bottleBrand: string;
    totalMl: number;
    remainingMl: number;
    image: string;
    expiresAt: string;
}

export interface Redemption {
    id: string;
    purchase_id: string;
    peg_size_ml: number;
    qr_token: string;
    qr_data: string;
    qr_expires_at: string;
    status: 'pending' | 'redeemed' | 'expired';
    created_at: string;
    redeemed_at: string | null;
}

export interface Profile {
    user: User;
    total_bottles: number;
    total_spent: number;
    total_redemptions: number;
}

// Request types
export interface GoogleLoginRequest {
    token: string;
}

export interface PhoneSendOTPRequest {
    phone: string;
}

export interface PhoneVerifyOTPRequest {
    phone: string;
    otp_code: string;
}

export interface PurchaseCreateRequest {
    bottle_id: string;
    venue_id: string;
}

export interface PurchaseConfirmRequest {
    payment_method: 'upi' | 'card';
}

export interface RedemptionCreateRequest {
    purchase_id: string;
    peg_size_ml: number;
}

export interface ProfileUpdateRequest {
    name?: string;
    email?: string;
}

export interface QRValidationRequest {
    qr_token: string;
}

export interface QRValidationResponse {
    success: boolean;
    message: string;
    redemption: Redemption | null;
}
