import { google } from 'googleapis';
import { cookies } from 'next/headers';
import { CalendarEvent, EventCategory } from '@/types/calendar';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

export const GOOGLE_TOKEN_COOKIE_NAME = 'focusdeck_gcal_tokens';

export function isGoogleConfigured(): boolean {
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
}

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

export function getGoogleConsentUrl(): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // needed to receive a refresh token
    prompt: 'consent',      // forces refresh token generation
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events.readonly',
    ],
  });
}

export async function getStoredGoogleTokens() {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get(GOOGLE_TOKEN_COOKIE_NAME);
  if (!tokenCookie?.value) return null;
  try {
    return JSON.parse(tokenCookie.value);
  } catch {
    return null;
  }
}

export async function saveGoogleTokens(tokens: Record<string, unknown>) {
  const cookieStore = await cookies();
  const existing = await getStoredGoogleTokens();
  const merged = { ...(existing || {}), ...tokens };

  cookieStore.set(GOOGLE_TOKEN_COOKIE_NAME, JSON.stringify(merged), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearGoogleTokens() {
  const cookieStore = await cookies();
  cookieStore.delete(GOOGLE_TOKEN_COOKIE_NAME);
}

export async function getAuthenticatedCalendar() {
  const tokens = await getStoredGoogleTokens();
  if (!tokens || !tokens.access_token) return null;

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials(tokens);

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

function categorizeEvent(title: string, description?: string): EventCategory {
  const text = `${title} ${description || ''}`.toLowerCase();
  if (text.includes('focus') || text.includes('deep work') || text.includes('study') || text.includes('code')) return 'Focus';
  if (text.includes('meet') || text.includes('sync') || text.includes('call') || text.includes('1:1') || text.includes('standup') || text.includes('interview')) return 'Meeting';
  if (text.includes('design') || text.includes('ui') || text.includes('ux') || text.includes('figma') || text.includes('prototype')) return 'Design';
  if (text.includes('gym') || text.includes('workout') || text.includes('run') || text.includes('doctor') || text.includes('lunch') || text.includes('dinner') || text.includes('personal')) return 'Personal';
  return 'Work';
}

export function formatGoogleCalendarEvent(item: any): CalendarEvent | null {
  const title = item.summary || 'Untitled Event';
  const start = item.start?.dateTime || item.start?.date;
  const end = item.end?.dateTime || item.end?.date;
  if (!start) return null;

  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date(startDate.getTime() + 3600000);
  const isAllDay = !item.start?.dateTime;

  const formatTime = (d: Date) => {
    if (isAllDay) return 'All day';
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  };

  const year = startDate.getFullYear();
  const month = String(startDate.getMonth() + 1).padStart(2, '0');
  const day = String(startDate.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  return {
    id: item.id || `gcal-${startDate.getTime()}`,
    title,
    startTime: formatTime(startDate),
    endTime: formatTime(endDate),
    date: dateStr,
    timestamp: startDate.getTime(),
    endTimestamp: endDate.getTime(),
    category: categorizeEvent(title, item.description),
    description: item.description || undefined,
    location: item.location || undefined,
    url: item.hangoutLink || item.htmlLink || undefined,
    source: 'google',
    created_at: item.created || new Date().toISOString(),
  };
}
