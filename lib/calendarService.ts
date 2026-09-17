import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { CalendarEvent } from '@/types/calendar';
import { formatGoogleCalendarEvent } from './googleCalendar';
import { supabase } from './supabase';

export interface StoredGoogleTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number; // epoch ms
  scopes?: string[];
  updatedAt?: number;
}

export class NoGoogleTokensError extends Error {
  readonly code = 'NO_GOOGLE_TOKENS';
  constructor(userId: string) {
    super(`No Google Calendar tokens found for user ${userId}. Please connect your Google account.`);
    this.name = 'NoGoogleTokensError';
  }
}

export class InsufficientCalendarScopeError extends Error {
  readonly code = 'INSUFFICIENT_CALENDAR_SCOPE';
  constructor(userId: string) {
    super(`Google Calendar permissions are not granted for user ${userId}. Please grant Calendar access.`);
    this.name = 'InsufficientCalendarScopeError';
  }
}

export function hasCalendarScope(tokens: StoredGoogleTokens | null): boolean {
  if (!tokens || !tokens.accessToken) return false;
  if (Array.isArray(tokens.scopes) && tokens.scopes.length > 0) {
    return tokens.scopes.some((s) =>
      s.includes('calendar') ||
      s.includes('calendar.events') ||
      s.includes('calendar.readonly')
    );
  }
  return true;
}

// ---------------------------------------------------------
// 1. Encryption Utilities (AES-256-GCM)
// ---------------------------------------------------------

function getEncryptionKey(): Buffer {
  const secret =
    process.env.WORKOS_COOKIE_PASSWORD ||
    process.env.WORKOS_API_KEY ||
    'focusdeck-workos-calendar-secret-key-32chars!';
  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptTokens(tokens: StoredGoogleTokens): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(JSON.stringify(tokens), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptTokens(cipherText: string): StoredGoogleTokens {
  const key = getEncryptionKey();
  const [ivHex, authTagHex, encryptedHex] = cipherText.split(':');
  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error('Invalid encrypted token payload');
  }
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}

// ---------------------------------------------------------
// 2. Token Repository (Memory + Persistent Local + Optional DB)
// ---------------------------------------------------------

const inMemoryTokenStore = new Map<string, string>();

function getLocalStoreFilePath(): string {
  return path.join(process.cwd(), '.data', 'workos_user_tokens.json');
}

function loadLocalFileStore(): Record<string, string> {
  try {
    const filePath = getLocalStoreFilePath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch {
    // Ignore file read errors
  }
  return {};
}

function saveLocalFileStore(data: Record<string, string>): void {
  try {
    const filePath = getLocalStoreFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch {
    // Ignore file write errors in restricted environments
  }
}

export async function storeUserGoogleTokens(
  userId: string,
  tokens: StoredGoogleTokens
): Promise<void> {
  if (!userId) throw new Error('userId is required to store tokens');

  const payload: StoredGoogleTokens = {
    ...tokens,
    updatedAt: Date.now(),
  };

  const encrypted = encryptTokens(payload);
  inMemoryTokenStore.set(userId, encrypted);

  // Persist locally for dev server persistence
  const localData = loadLocalFileStore();
  localData[userId] = encrypted;
  saveLocalFileStore(localData);

  // If Supabase is connected, store in database as well
  if (supabase) {
    try {
      await supabase.from('user_google_tokens').upsert({
        user_id: userId,
        encrypted_tokens: encrypted,
        updated_at: new Date().toISOString(),
      });
    } catch {
      // Graceful fallback to memory/file
    }
  }
}

export async function getUserGoogleTokens(
  userId: string
): Promise<StoredGoogleTokens | null> {
  if (!userId) return null;

  // 1. Check in-memory store
  let encrypted = inMemoryTokenStore.get(userId);

  // 2. Check local file store
  if (!encrypted) {
    const localData = loadLocalFileStore();
    encrypted = localData[userId];
    if (encrypted) {
      inMemoryTokenStore.set(userId, encrypted);
    }
  }

  // 3. Check Supabase if configured
  if (!encrypted && supabase) {
    try {
      const { data } = await supabase
        .from('user_google_tokens')
        .select('encrypted_tokens')
        .eq('user_id', userId)
        .single();
      if (typeof data?.encrypted_tokens === 'string') {
        encrypted = data.encrypted_tokens;
        inMemoryTokenStore.set(userId, encrypted);
      }
    } catch {
      // Ignore database fetch error
    }
  }

  if (!encrypted) return null;

  try {
    return decryptTokens(encrypted);
  } catch {
    return null;
  }
}

export async function clearUserGoogleTokens(userId: string): Promise<void> {
  inMemoryTokenStore.delete(userId);
  const localData = loadLocalFileStore();
  if (localData[userId]) {
    delete localData[userId];
    saveLocalFileStore(localData);
  }
  if (supabase) {
    try {
      await supabase.from('user_google_tokens').delete().eq('user_id', userId);
    } catch {
      // Ignore
    }
  }
}

// Helpers for testing
export function _resetTokenStoreForTesting(): void {
  inMemoryTokenStore.clear();
}

// ---------------------------------------------------------
// 3. Isolated Calendar Client & Token Refresher Interfaces
// ---------------------------------------------------------

export interface CalendarClient {
  listEvents(options: {
    calendarId: string;
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    singleEvents?: boolean;
    orderBy?: string;
  }): Promise<{ items: any[] }>;
}

export interface TokenRefresher {
  refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresAt: number;
  }>;
}

export class DefaultTokenRefresher implements TokenRefresher {
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresAt: number;
  }> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      // Alternatively, Google OAuth client can be refreshed via token endpoint
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId || '',
          client_secret: clientSecret || '',
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to refresh Google token: ${res.statusText}`);
      }

      const data = await res.json();
      return {
        accessToken: data.access_token,
        expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
      };
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();

    return {
      accessToken: credentials.access_token || '',
      expiresAt: credentials.expiry_date || Date.now() + 3600 * 1000,
    };
  }
}

export class GoogleApiCalendarClient implements CalendarClient {
  private calendar: any;

  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({ access_token: accessToken });
    this.calendar = google.calendar({ version: 'v3', auth });
  }

  async listEvents(options: {
    calendarId: string;
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    singleEvents?: boolean;
    orderBy?: string;
  }): Promise<{ items: any[] }> {
    const response = await this.calendar.events.list(options);
    return { items: response.data.items || [] };
  }
}

export function createDefaultCalendarClient(accessToken: string): CalendarClient {
  return new GoogleApiCalendarClient(accessToken);
}

// ---------------------------------------------------------
// 4. Main Service: getUserCalendarEvents(userId)
// ---------------------------------------------------------

export interface GetUserCalendarEventsOptions {
  calendarClientFactory?: (accessToken: string) => CalendarClient;
  tokenRefresher?: TokenRefresher;
  timeMin?: Date;
  timeMax?: Date;
}

export async function getUserCalendarEvents(
  userId: string,
  options: GetUserCalendarEventsOptions = {}
): Promise<CalendarEvent[]> {
  const tokens = await getUserGoogleTokens(userId);

  if (!tokens || !tokens.accessToken) {
    throw new NoGoogleTokensError(userId);
  }

  if (!hasCalendarScope(tokens)) {
    throw new InsufficientCalendarScopeError(userId);
  }

  let effectiveAccessToken = tokens.accessToken;
  const isExpired = tokens.expiresAt ? tokens.expiresAt <= Date.now() : false;

  // If token is expired, refresh via refresh_token
  if (isExpired) {
    if (!tokens.refreshToken) {
      throw new NoGoogleTokensError(userId);
    }

    const refresher = options.tokenRefresher || new DefaultTokenRefresher();
    const refreshed = await refresher.refreshAccessToken(tokens.refreshToken);

    effectiveAccessToken = refreshed.accessToken;
    await storeUserGoogleTokens(userId, {
      ...tokens,
      accessToken: refreshed.accessToken,
      expiresAt: refreshed.expiresAt,
    });
  }

  const clientFactory = options.calendarClientFactory || createDefaultCalendarClient;
  const calendarClient = clientFactory(effectiveAccessToken);

  // Default window: 30 days past to 90 days future
  const timeMin = options.timeMin || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const timeMax = options.timeMax || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  const { items } = await calendarClient.listEvents({
    calendarId: 'primary',
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    maxResults: 100,
    singleEvents: true,
    orderBy: 'startTime',
  });

  const formatted: CalendarEvent[] = (items || [])
    .map(formatGoogleCalendarEvent)
    .filter((e): e is CalendarEvent => e !== null);

  return formatted;
}
