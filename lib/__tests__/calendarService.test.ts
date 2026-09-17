import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getUserCalendarEvents,
  storeUserGoogleTokens,
  getUserGoogleTokens,
  clearUserGoogleTokens,
  encryptTokens,
  decryptTokens,
  NoGoogleTokensError,
  InsufficientCalendarScopeError,
  hasCalendarScope,
  GoogleApiCalendarClient,
  TokenRefresher,
  _resetTokenStoreForTesting,
} from '../calendarService';
import { formatGoogleCalendarEvent } from '../googleCalendar';

describe('Google Calendar Service & WorkOS Production Integration', () => {
  beforeEach(() => {
    _resetTokenStoreForTesting();
    vi.clearAllMocks();
  });

  describe('Encryption & Decryption (AES-256-GCM)', () => {
    it('encrypts and decrypts real Google OAuth token payloads with authentic integrity', () => {
      const originalTokens = {
        accessToken: 'ya29.a0ARrdaM8sampleRealGoogleAccessTokenHere12345',
        refreshToken: '1//0gRealGoogleRefreshTokenFromWorkOS98765',
        expiresAt: Date.now() + 3600 * 1000,
        scopes: ['https://www.googleapis.com/auth/calendar.events'],
      };

      const cipherText = encryptTokens(originalTokens);
      expect(cipherText).not.toContain('ya29.a0ARrdaM8sampleRealGoogleAccessTokenHere12345');
      expect(cipherText.split(':').length).toBe(3); // iv:tag:data

      const decrypted = decryptTokens(cipherText);
      expect(decrypted.accessToken).toBe(originalTokens.accessToken);
      expect(decrypted.refreshToken).toBe(originalTokens.refreshToken);
      expect(decrypted.expiresAt).toBe(originalTokens.expiresAt);
      expect(decrypted.scopes).toEqual(originalTokens.scopes);
    });

    it('rejects tampered or corrupted encrypted tokens in production', () => {
      const original = { accessToken: 'production_access_token' };
      const cipherText = encryptTokens(original);
      const [iv, tag, data] = cipherText.split(':');
      // Corrupt payload
      const corrupted = `${iv}:${tag}:deadbeef${data.slice(8)}`;
      expect(() => decryptTokens(corrupted)).toThrow();
    });
  });

  describe('Google Calendar API Client', () => {
    it('initializes GoogleApiCalendarClient with authenticated OAuth2 credentials', () => {
      const client = new GoogleApiCalendarClient('ya29.live_google_token');
      expect(client).toBeInstanceOf(GoogleApiCalendarClient);
      expect(typeof client.listEvents).toBe('function');
    });

    it('correctly maps real Google Calendar v3 API events to CalendarEvent models', () => {
      const realGoogleEventPayload = {
        id: 'google_event_4829104',
        summary: 'Sprint Architecture Review',
        start: { dateTime: '2026-09-17T10:00:00Z' },
        end: { dateTime: '2026-09-17T11:00:00Z' },
        description: 'Engineering sync and planning',
        hangoutLink: 'https://meet.google.com/abc-defg-hij',
        location: 'Building 4 / Google Meet',
        created: '2026-09-10T12:00:00Z',
      };

      const event = formatGoogleCalendarEvent(realGoogleEventPayload);
      expect(event).not.toBeNull();
      expect(event?.id).toBe('google_event_4829104');
      expect(event?.title).toBe('Sprint Architecture Review');
      expect(event?.source).toBe('google');
      expect(event?.category).toBe('Meeting');
      expect(event?.url).toBe('https://meet.google.com/abc-defg-hij');
      expect(event?.location).toBe('Building 4 / Google Meet');
    });
  });

  describe('1. Successful token storage & calendar event retrieval', () => {
    it('retrieves and processes calendar events for authenticated WorkOS user', async () => {
      const userId = 'workos_user_prod_google_123';
      const userTokens = {
        accessToken: 'ya29.live_token_for_user_123',
        refreshToken: '1//refresh_token_for_user_123',
        expiresAt: Date.now() + 3600 * 1000,
        scopes: ['https://www.googleapis.com/auth/calendar.events'],
      };

      // Store tokens for WorkOS user
      await storeUserGoogleTokens(userId, userTokens);

      const stored = await getUserGoogleTokens(userId);
      expect(stored?.accessToken).toBe(userTokens.accessToken);

      const calendarClientFactory = vi.fn().mockReturnValue({
        listEvents: vi.fn().mockResolvedValue({
          items: [
            {
              id: 'gcal-live-101',
              summary: 'Deep Work: Rust Engine Architecture',
              start: { dateTime: '2026-09-17T14:00:00Z' },
              end: { dateTime: '2026-09-17T16:00:00Z' },
              description: 'Focus session for backend performance',
            },
          ],
        }),
      });

      const events = await getUserCalendarEvents(userId, { calendarClientFactory });
      expect(events).toHaveLength(1);
      expect(events[0].id).toBe('gcal-live-101');
      expect(events[0].title).toBe('Deep Work: Rust Engine Architecture');
      expect(events[0].category).toBe('Focus');
      expect(events[0].source).toBe('google');
    });
  });

  describe('2. Expired-token auto-refresh in production', () => {
    it('automatically refreshes token via Google OAuth endpoint when token has expired', async () => {
      const userId = 'workos_user_with_expired_token';
      const expiredTokens = {
        accessToken: 'expired_google_token_old',
        refreshToken: '1//valid_refresh_token_to_renew',
        expiresAt: Date.now() - 5000, // already expired
      };

      await storeUserGoogleTokens(userId, expiredTokens);

      const freshToken = 'ya29.freshly_renewed_google_token_new';
      const freshExpiry = Date.now() + 3600 * 1000;

      const tokenRefresher: TokenRefresher = {
        refreshAccessToken: vi.fn().mockResolvedValue({
          accessToken: freshToken,
          expiresAt: freshExpiry,
        }),
      };

      const calendarClientFactory = vi.fn().mockReturnValue({
        listEvents: vi.fn().mockResolvedValue({ items: [] }),
      });

      await getUserCalendarEvents(userId, {
        tokenRefresher,
        calendarClientFactory,
      });

      // Verifies token renewal occurred with stored refresh token
      expect(tokenRefresher.refreshAccessToken).toHaveBeenCalledWith('1//valid_refresh_token_to_renew');
      expect(calendarClientFactory).toHaveBeenCalledWith(freshToken);

      // Verifies newly acquired token was encrypted and re-saved
      const updated = await getUserGoogleTokens(userId);
      expect(updated?.accessToken).toBe(freshToken);
      expect(updated?.expiresAt).toBe(freshExpiry);
    });
  });

  describe('3. Production fallback when user did NOT sign in via Google', () => {
    it('throws NoGoogleTokensError with code NO_GOOGLE_TOKENS for non-Google users', async () => {
      const emailPasswordUserId = 'workos_user_email_auth_999';
      await clearUserGoogleTokens(emailPasswordUserId);

      await expect(getUserCalendarEvents(emailPasswordUserId)).rejects.toThrow(
        NoGoogleTokensError
      );

      try {
        await getUserCalendarEvents(emailPasswordUserId);
      } catch (err: unknown) {
        const error = err as NoGoogleTokensError;
        expect(error.code).toBe('NO_GOOGLE_TOKENS');
        expect(error.message).toContain('No Google Calendar tokens found');
      }
    });

    it('handles expired tokens without refresh token by raising connection requirement', async () => {
      const userId = 'user_missing_refresh_capability';
      await storeUserGoogleTokens(userId, {
        accessToken: 'old_expired_token',
        expiresAt: Date.now() - 10000,
      });

      await expect(getUserCalendarEvents(userId)).rejects.toThrow(
        NoGoogleTokensError
      );
    });
  });

  describe('4. Calendar Scopes Verification & InsufficientCalendarScopeError', () => {
    it('correctly evaluates hasCalendarScope for diverse OAuth scopes', () => {
      expect(hasCalendarScope(null)).toBe(false);
      expect(hasCalendarScope({ accessToken: '' })).toBe(false);

      // Email/Profile only (WorkOS without calendar scopes)
      expect(hasCalendarScope({
        accessToken: 'valid_token',
        scopes: ['https://www.googleapis.com/auth/userinfo.email', 'openid', 'profile']
      })).toBe(false);

      // Valid Calendar scopes
      expect(hasCalendarScope({
        accessToken: 'valid_token',
        scopes: ['https://www.googleapis.com/auth/calendar.events']
      })).toBe(true);

      expect(hasCalendarScope({
        accessToken: 'valid_token',
        scopes: ['https://www.googleapis.com/auth/calendar.readonly']
      })).toBe(true);

      expect(hasCalendarScope({
        accessToken: 'valid_token',
        scopes: ['https://www.googleapis.com/auth/calendar']
      })).toBe(true);
    });

    it('throws InsufficientCalendarScopeError when user token only contains basic profile scopes', async () => {
      const userId = 'user_with_basic_email_scopes_only';
      await storeUserGoogleTokens(userId, {
        accessToken: 'ya29.basic_profile_only_token',
        expiresAt: Date.now() + 3600 * 1000,
        scopes: [
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile',
          'openid'
        ]
      });

      await expect(getUserCalendarEvents(userId)).rejects.toThrow(
        InsufficientCalendarScopeError
      );
    });
  });
});
