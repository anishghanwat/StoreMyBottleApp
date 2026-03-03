// Admin API Type Definitions

// ============ Auth Types ============
export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    user: User;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'bartender' | 'customer';
    venue_id?: string | null;
    created_at: string;
}

export interface RefreshTokenRequest {
    refresh_token: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    new_password: string;
}

export interface VerifyResetTokenRequest {
    token: string;
}

// ============ Venue Types ============
export interface Venue {
    id: string;
    name: string;
    location: string;
    city?: string;
    state?: string;
    country?: string;
    is_open: boolean;
    contact_email?: string | null;
    contact_phone?: string | null;
    image_url: string | null;
    created_at: string;
}

export interface VenueCreateRequest {
    name: string;
    location: string;
    city?: string;
    state?: string;
    country?: string;
    is_open?: boolean;
    contact_email?: string | null;
    contact_phone?: string | null;
    image_url?: string | null;
}

export interface VenueUpdateRequest extends Partial<VenueCreateRequest> { }

// ============ Bottle Types ============
export interface Bottle {
    id: string;
    venue_id: string;
    brand: string;
    name: string;
    category?: string | null;
    description?: string | null;
    price: number;
    volume_ml: number;
    image_url: string | null;
    is_available: boolean;
    created_at: string;
}

export interface BottleCreateRequest {
    venue_id: string;
    brand: string;
    name: string;
    category?: string | null;
    description?: string | null;
    price: number;
    volume_ml: number;
    image_url?: string | null;
    is_available?: boolean;
}

export interface BottleUpdateRequest extends Partial<BottleCreateRequest> { }

// ============ Purchase Types ============
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

export interface PurchaseFilters {
    status?: string;
    venue_id?: string;
    user_id?: string;
}

// ============ Redemption Types ============
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
    redeemed_by_id: string | null;
}

export interface RedemptionFilters {
    status?: string;
    venue_id?: string;
    user_id?: string;
}

// ============ Bartender Types ============
export interface Bartender {
    id: string;
    email: string;
    name: string;
    phone?: string | null;
    venue_id: string;
    role: 'bartender';
    is_approved: boolean;
    created_at: string;
}

export interface BartenderCreateRequest {
    email: string;
    password: string;
    name: string;
    phone?: string | null;
    venue_id: string;
}

export interface BartenderUpdateRequest {
    email?: string;
    name?: string;
    phone?: string | null;
    venue_id?: string;
    is_approved?: boolean;
}

// ============ User Management Types ============
export interface UserUpdateRoleRequest {
    role: 'admin' | 'bartender' | 'user';
    venue_id?: string | null;
}

// ============ Analytics Types ============
export interface DateRangeFilters {
    start_date?: string;
    end_date?: string;
    venue_id?: string;
}

export interface RevenueAnalytics {
    total_revenue: number;
    revenue_by_venue: Array<{
        venue_id: string;
        venue_name: string;
        revenue: number;
    }>;
    revenue_by_date: Array<{
        date: string;
        revenue: number;
    }>;
}

export interface SalesAnalytics {
    total_sales: number;
    sales_by_venue: Array<{
        venue_id: string;
        venue_name: string;
        sales_count: number;
    }>;
    sales_by_bottle: Array<{
        bottle_id: string;
        bottle_name: string;
        sales_count: number;
    }>;
}

export interface RedemptionAnalytics {
    total_redemptions: number;
    redemptions_by_venue: Array<{
        venue_id: string;
        venue_name: string;
        redemption_count: number;
    }>;
    average_peg_size: number;
}

export interface UserAnalytics {
    total_users: number;
    new_users: number;
    active_users: number;
    users_by_date: Array<{
        date: string;
        count: number;
    }>;
}

// ============ Promotion Types ============
export interface Promotion {
    id: string;
    code: string;
    description: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_purchase_amount?: number | null;
    max_discount_amount?: number | null;
    venue_id?: string | null;
    start_date: string;
    end_date: string;
    is_active: boolean;
    usage_limit?: number | null;
    usage_count: number;
    created_at: string;
}

export interface PromotionCreateRequest {
    code: string;
    description: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_purchase_amount?: number | null;
    max_discount_amount?: number | null;
    venue_id?: string | null;
    start_date: string;
    end_date: string;
    is_active?: boolean;
    usage_limit?: number | null;
}

export interface PromotionUpdateRequest extends Partial<PromotionCreateRequest> { }

export interface PromotionFilters {
    status?: string;
    venue_id?: string;
}

export interface PromotionValidationRequest {
    code: string;
    purchase_id: string;
}

// ============ Support Ticket Types ============
export interface SupportTicket {
    id: string;
    user_id: string;
    subject: string;
    description: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    assigned_to_id?: string | null;
    created_at: string;
    updated_at: string;
    resolved_at?: string | null;
}

export interface SupportTicketCreateRequest {
    user_id: string;
    subject: string;
    description: string;
    category: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface SupportTicketUpdateRequest {
    subject?: string;
    description?: string;
    category?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    status?: 'open' | 'in_progress' | 'resolved' | 'closed';
    assigned_to_id?: string | null;
}

export interface SupportTicketFilters {
    status?: string;
    category?: string;
    priority?: string;
    assigned_to_id?: string;
}

export interface TicketComment {
    id: string;
    ticket_id: string;
    user_id: string;
    comment: string;
    created_at: string;
}

export interface TicketCommentCreateRequest {
    comment: string;
}

// ============ Audit Log Types ============
export interface AuditLog {
    id: string;
    user_id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    changes?: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
}

export interface AuditLogFilters {
    user_id?: string;
    action?: string;
    entity_type?: string;
    start_date?: string;
    end_date?: string;
    skip?: number;
    limit?: number;
}

// ============ Settings Types ============
export interface Setting {
    key: string;
    value: string;
    category: string;
    description?: string;
    is_public: boolean;
    created_at: string;
    updated_at: string;
}

export interface SettingCreateRequest {
    key: string;
    value: string;
    category: string;
    description?: string;
    is_public?: boolean;
}

export interface SettingUpdateRequest {
    value?: string;
    category?: string;
    description?: string;
    is_public?: boolean;
}

export interface SettingFilters {
    category?: string;
    is_public?: boolean;
}

export interface BulkUpdateSettingsRequest {
    settings: Array<{
        key: string;
        value: string;
    }>;
}

// ============ Dashboard Stats Types ============
export interface DashboardStats {
    total_users: number;
    total_venues: number;
    total_bottles: number;
    total_purchases: number;
    total_revenue: number;
    active_redemptions: number;
    pending_purchases: number;
}

// ============ Response Wrappers ============
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    skip: number;
    limit: number;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
