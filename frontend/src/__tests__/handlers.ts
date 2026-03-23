import { http, HttpResponse } from 'msw';

const BASE = 'http://localhost:8000/api';

export const handlers = [
  // purchaseService.getUserBottles
  http.get(`${BASE}/purchases/my-bottles`, () =>
    HttpResponse.json({
      bottles: [
        {
          id: 'bottle-1',
          bottleId: 'cat-1',
          bottleName: 'Grey Goose',
          bottleBrand: 'Grey Goose',
          venueName: 'Test Venue',
          remainingMl: 500,
          totalMl: 750,
          purchaseId: 'purchase-1',
          purchasedAt: '2025-01-01T00:00:00Z',
          image: null,
          expiresAt: null,
        },
      ],
      total: 1,
    })
  ),

  // purchaseService.getPendingPurchases
  http.get(`${BASE}/purchases/pending`, () =>
    HttpResponse.json([
      {
        id: 'purchase-pending-1',
        user_id: 'user-1',
        bottle_id: 'bottle-1',
        venue_id: 'venue-1',
        total_ml: 750,
        remaining_ml: 750,
        purchase_price: 3500,
        payment_status: 'pending',
        payment_method: null,
        purchased_at: null,
        created_at: new Date().toISOString(),
      },
    ])
  ),

  // authService.login — success
  http.post(`${BASE}/auth/login`, () =>
    HttpResponse.json({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      token_type: 'bearer',
      user: { id: 'user-1', name: 'Test User', email: 'test@test.com', phone: null, created_at: '2025-01-01' },
    })
  ),

  // authService.login — 401 for bad credentials
  http.post(`${BASE}/auth/login-bad`, () =>
    HttpResponse.json({ detail: 'Invalid credentials' }, { status: 401 })
  ),
];
