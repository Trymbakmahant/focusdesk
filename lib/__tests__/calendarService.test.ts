import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getUserCalendarEvents,
  storeUserGoogleTokens,
  getUserGoogleTokens,
  clearUserGoogleTokens,
  encryptTokens,
  decryptTokens,
  NoGoogleTokensError,
  CalendarClient,
  TokenRefresher,
  _resetTokenStoreForTesting,
} from '../calendarService';

describe('Google Calendar Service & WorkOS Integration', () => {
  beforeEach(() => {
    _resetTokenStoreForTesting();
    vi.clearAllMocks();
  });

  describe('Encryption & Decryption (AES-256-GCM)', () => {
    it('encrypts and decrypts tokens successfully', () => {
      const original = {
        accessToken: 'ya29.mock_access_token_12345',
        refreshToken: '1//mock_refresh_token_67890',
        expiresAt: Date.now() + 3600 * 1000,
        scopes: ['https://www.googleapis.com/auth/calendar.events'],
      };

      const cipherText = encryptTokens(original);
      expect(cipherText).not.toContain('ya29.mock_access_token_12345');
      expect(cipherText.split(':').length).toBe(3); // iv:tag:data

      const decrypted = decryptTokens(cipherText);
      expect(decrypted.accessToken).toBe(original.accessToken);
      expect(decrypted.refreshToken).toBe(original.refreshToken);
      expect(decrypted.expiresAt).toBe(original.expiresAt);
      expect(decrypted.scopes).toEqual(original.scopes);
    });

    it('throws error when tampering with encrypted payload', () => {
      const original = { accessToken: 'secret_token' };
      const cipherText = encryptTokens(original);
      const [iv, tag, data] = cipherText.split(':');
      // Corrupt the ciphertext
      const corrupted = `${iv}:${tag}:deadbeef${data.slice(8)}`;
      expect(() => decryptTokens(corrupted)).toThrow();
    });
  });

  describe('1. Successful token exchange & event listing', () => {
    it('retrieves calendar events using stored valid access token', async () => {
      const userId = 'user_workos_google_valid';
      const mockTokens = {
        accessToken: 'valid_access_token_111',
        refreshToken: 'valid_refresh_token_222',
        expiresAt: Date.now() + 3600 * 1000, // 1 hour ahead
        scopes: ['https://www.googleapis.com/auth/calendar.events'],
      };

      // Store tokens for WorkOS user
      await storeUserGoogleTokens(userId, mockTokens);

      // Verify they are saved and encrypted
      const stored = await getUserGoogleTokens(userId);
      expect(stored).not.toBeNull();
      expect(stored?.accessToken).toBe('valid_access_token_111');

      // Mock Calendar Client
      const mockItems = [
        {
          id: 'event-1',
          summary: 'Sprint Architecture Review',
          start: { dateTime: '2026-09-17T10:00:00Z' },
          end: { dateTime: '2026-09-17T11:00:00Z' },
          description: 'Team architecture discussion',
          hangoutLink: 'https://meet.google.com/abc-defg-hij',
        },
        {
          id: 'event-2',
          summary: 'Deep Work: Rust Core Engine',
          start: { dateTime: '2026-09-17T14:00:00Z' },
          end: { dateTime: '2026-09-17T16:00:00Z' },
          description: 'Focus block for native integration',
        },
      ];

      const listEventsMock = vi.fn().mockResolvedValue({ items: mockItems });
      const mockCalendarClient: CalendarClient = {
        listEvents: listEventsMock,
      };
      const clientFactory = vi.fn().mockReturnValue(mockCalendarClient);

      // Execute service function
      const events = await getUserCalendarEvents(userId, {
        calendarClientFactory: clientFactory,
      });

      // Assertions
      expect(clientFactory).toHaveBeenCalledWith('valid_access_token_111');
      expect(listEventsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          calendarId: 'primary',
          singleEvents: true,
          orderBy: 'startTime',
        })
      );
      expect(events).toHaveLength(2);
      expect(events[0].title).toBe('Sprint Architecture Review');
      expect(events[0].source).toBe('google');
      expect(events[0].category).toBe('Work');
      expect(events[1].title).toBe('Deep Work: Rust Core Engine');
      expect(events[1].category).toBe('Focus');
    });
  });

  describe('2. Expired-token auto-refresh', () => {
    it('refreshes expired access token via refreshToken and persists updated tokens', async () => {
      const userId = 'user_workos_expired_token';
      const expiredTime = Date.now() - 60000; // expired 1 minute ago

      const initialTokens = {
        accessToken: 'expired_old_token',
        refreshToken: 'refresh_token_xyz',
        expiresAt: expiredTime,
      };

      await storeUserGoogleTokens(userId, initialTokens);

      const refreshedAccessToken = 'brand_new_refreshed_access_token_999';
      const newExpiresAt = Date.now() + 7200 * 1000;

      // Mock Token Refresher
      const mockRefresher: TokenRefresher = {
        refreshAccessToken: vi.fn().mockResolvedValue({
          accessToken: refreshedAccessToken,
          expiresAt: newExpiresAt,
        }),
      };

      // Mock Calendar Client
      const listEventsMock = vi.fn().mockResolvedValue({ items: [] });
      const clientFactory = vi.fn().mockReturnValue({ listEvents: listEventsMock });

      // Call service
      await getUserCalendarEvents(userId, {
        tokenRefresher: mockRefresher,
        calendarClientFactory: clientFactory,
      });

      // Assert refresher was invoked with stored refresh token
      expect(mockRefresher.refreshAccessToken).toHaveBeenCalledWith('refresh_token_xyz');

      // Assert calendar client was created with the refreshed access token
      expect(clientFactory).toHaveBeenCalledWith(refreshedAccessToken);

      // Assert new tokens were persisted
      const updatedStoredTokens = await getUserGoogleTokens(userId);
      expect(updatedStoredTokens?.accessToken).toBe(refreshedAccessToken);
      expect(updatedStoredTokens?.expiresAt).toBe(newExpiresAt);
      expect(updatedStoredTokens?.refreshToken).toBe('refresh_token_xyz');
    });
  });

  describe('3. No-Google-tokens fallback path', () => {
    it('throws NoGoogleTokensError when user did NOT sign in via Google', async () => {
      const nonGoogleUserId = 'user_email_password_only_456';

      // Ensure no tokens exist
      await clearUserGoogleTokens(nonGoogleUserId);

      await expect(getUserCalendarEvents(nonGoogleUserId)).rejects.toThrow(
        NoGoogleTokensError
      );

      try {
        await getUserCalendarEvents(nonGoogleUserId);
      } catch (err: any) {
        expect(err.code).toBe('NO_GOOGLE_TOKENS');
        expect(err.message).toContain('No Google Calendar tokens found');
      }
    });

    it('throws NoGoogleTokensError when token is expired and has no refresh token', async () => {
      const userId = 'user_no_refresh_token';
      await storeUserGoogleTokens(userId, {
        accessToken: 'expired_access_token',
        expiresAt: Date.now() - 10000,
        // No refreshToken
      });

      await expect(getUserCalendarEvents(userId)).rejects.toThrow(
        NoGoogleTokensError
      );
    });
  });
});
