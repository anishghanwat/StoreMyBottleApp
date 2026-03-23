import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../setup';
import { authService } from '../../services/auth.service';
import { sessionManager } from '../../utils/session';

describe('authService', () => {
  beforeEach(() => {
    sessionManager.clearSession();
  });

  describe('login', () => {
    it('returns token response and saves session on success', async () => {
      const result = await authService.login('test@test.com', 'password123');

      expect(result.access_token).toBe('mock-access-token');
      expect(result.refresh_token).toBe('mock-refresh-token');
      expect(result.user.email).toBe('test@test.com');

      // Session should be persisted
      expect(sessionManager.getAccessToken()).toBe('mock-access-token');
      expect(sessionManager.isLoggedIn()).toBe(true);
    });

    it('throws on invalid credentials (401)', async () => {
      server.use(
        http.post('http://localhost:8000/api/auth/login', () =>
          HttpResponse.json({ detail: 'Invalid credentials' }, { status: 401 })
        )
      );
      await expect(authService.login('bad@test.com', 'wrong')).rejects.toThrow();
    });

    it('throws on server error (500)', async () => {
      server.use(
        http.post('http://localhost:8000/api/auth/login', () =>
          HttpResponse.json({ detail: 'Internal error' }, { status: 500 })
        )
      );
      await expect(authService.login('test@test.com', 'pass')).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('clears the session', async () => {
      // First log in
      await authService.login('test@test.com', 'password123');
      expect(sessionManager.isLoggedIn()).toBe(true);

      // Then log out
      authService.logout();
      expect(sessionManager.isLoggedIn()).toBe(false);
      expect(sessionManager.getAccessToken()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('returns false when no session', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('returns true after successful login', async () => {
      await authService.login('test@test.com', 'password123');
      expect(authService.isAuthenticated()).toBe(true);
    });
  });

  describe('getStoredUser', () => {
    it('returns null when not logged in', () => {
      expect(authService.getStoredUser()).toBeNull();
    });

    it('returns user after login', async () => {
      await authService.login('test@test.com', 'password123');
      const user = authService.getStoredUser();
      expect(user?.email).toBe('test@test.com');
      expect(user?.name).toBe('Test User');
    });
  });
});
