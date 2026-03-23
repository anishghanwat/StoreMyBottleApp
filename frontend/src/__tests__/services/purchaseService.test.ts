import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../setup';
import { purchaseService } from '../../services/purchase.service';

describe('purchaseService', () => {
  describe('getUserBottles', () => {
    it('returns the bottles array from the API response', async () => {
      const bottles = await purchaseService.getUserBottles();
      expect(bottles).toHaveLength(1);
      expect(bottles[0].bottleName).toBe('Grey Goose');
      expect(bottles[0].remainingMl).toBe(500);
    });

    it('returns empty array when no bottles exist', async () => {
      server.use(
        http.get('http://localhost:8000/api/purchases/my-bottles', () =>
          HttpResponse.json({ bottles: [], total: 0 })
        )
      );
      const bottles = await purchaseService.getUserBottles();
      expect(bottles).toHaveLength(0);
    });

    it('throws on server error', async () => {
      server.use(
        http.get('http://localhost:8000/api/purchases/my-bottles', () =>
          HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
        )
      );
      await expect(purchaseService.getUserBottles()).rejects.toThrow();
    });
  });

  describe('getPendingPurchases', () => {
    it('returns pending purchases array', async () => {
      const pending = await purchaseService.getPendingPurchases();
      expect(pending).toHaveLength(1);
      expect(pending[0].payment_status).toBe('pending');
      expect(pending[0].purchase_price).toBe(3500);
    });

    it('returns empty array when no pending purchases', async () => {
      server.use(
        http.get('http://localhost:8000/api/purchases/pending', () =>
          HttpResponse.json([])
        )
      );
      const pending = await purchaseService.getPendingPurchases();
      expect(pending).toHaveLength(0);
    });
  });

  describe('createPurchase', () => {
    beforeEach(() => {
      server.use(
        http.post('http://localhost:8000/api/purchases', () =>
          HttpResponse.json({
            id: 'new-purchase-1',
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
          })
        )
      );
    });

    it('creates a purchase and returns it', async () => {
      const purchase = await purchaseService.createPurchase('bottle-1', 'venue-1');
      expect(purchase.id).toBe('new-purchase-1');
      expect(purchase.payment_status).toBe('pending');
    });
  });
});
