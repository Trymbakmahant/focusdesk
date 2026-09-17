"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CalendarEvent } from '@/types/calendar';
import { parseIcsContent } from '@/lib/icsParser';

export function useCalendar() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [googleCalendarUrl, setGoogleCalendarUrl] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isGoogleConfigured, setIsGoogleConfigured] = useState(false);

  // Storage key scoped to authenticated user
  const storageKey = useMemo(() => {
    return user ? `focusdeck_calendar_${user.id}` : 'focusdeck_calendar_guest';
  }, [user]);

  const urlStorageKey = useMemo(() => {
    return user ? `focusdeck_gcal_url_${user.id}` : 'focusdeck_gcal_url_guest';
  }, [user]);

  // 1. Load local calendar from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setEvents(parsed);
        }
      }

      const savedUrl = localStorage.getItem(urlStorageKey);
      if (savedUrl) {
        setGoogleCalendarUrl(savedUrl);
      }
    } catch {
      // Fallback to empty list
    } finally {
      setIsLoaded(true);
    }
  }, [storageKey, urlStorageKey]);

  // 2. Persist whenever events change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(events));
    } catch (err) {
      console.error('Failed to persist calendar events:', err);
    }
  }, [events, isLoaded, storageKey]);

  // 3. Persist URL
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(urlStorageKey, googleCalendarUrl);
    } catch (err) {
      console.error('Failed to persist gcal url:', err);
    }
  }, [googleCalendarUrl, isLoaded, urlStorageKey]);

  // 4. Sync events from Google Calendar API
  const syncGoogleCalendar = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/calendar/google/events');
      if (!res.ok) {
        throw new Error('Failed to fetch events from Google Calendar API');
      }

      const data = await res.json();
      setIsGoogleConnected(Boolean(data.isConnected));
      setIsGoogleConfigured(Boolean(data.isConfigured));

      if (data.isConnected && Array.isArray(data.events)) {
        setEvents((prev) => {
          // Keep manually created events, replace Google events with fresh sync
          const nonGoogle = prev.filter((e) => e.source !== 'google');
          return [...data.events, ...nonGoogle].sort((a, b) => a.timestamp - b.timestamp);
        });
        return data.events.length;
      }
      return 0;
    } catch (err) {
      console.error('Error syncing Google Calendar:', err);
      return 0;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // 5. Check Google OAuth connection status on mount and sync if connected
  useEffect(() => {
    fetch('/api/calendar/google/status')
      .then((res) => res.json())
      .then((data) => {
        setIsGoogleConnected(Boolean(data.isConnected));
        setIsGoogleConfigured(Boolean(data.isConfigured));
        if (data.isConnected) {
          syncGoogleCalendar();
        }
      })
      .catch(() => {});
  }, [syncGoogleCalendar]);

  // 6. Connect via Google OAuth 2.0
  const connectGoogleOAuth = useCallback(() => {
    window.location.assign('/api/auth/google/url?redirect=true');
  }, []);

  // 7. Disconnect Google Calendar
  const disconnectGoogle = useCallback(async () => {
    try {
      await fetch('/api/calendar/google/disconnect', { method: 'POST' });
      setIsGoogleConnected(false);
      setEvents((prev) => prev.filter((e) => e.source !== 'google'));
    } catch (err) {
      console.error('Failed to disconnect Google Calendar:', err);
    }
  }, []);

  // 8. Import raw ICS string (from manual file upload)
  const importIcs = useCallback((icsContent: string) => {
    const parsed = parseIcsContent(icsContent);
    if (parsed.length === 0) {
      throw new Error('No valid calendar events found in this .ics content.');
    }

    setEvents((prev) => {
      const nonGoogle = prev.filter((e) => e.source !== 'google');
      return [...parsed, ...nonGoogle].sort((a, b) => a.timestamp - b.timestamp);
    });

    return parsed.length;
  }, []);

  // 9. Import from Google Calendar iCal public URL (fallback method)
  const importFromUrl = useCallback(async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) throw new Error('Please provide a valid Google Calendar URL');

    setGoogleCalendarUrl(trimmed);

    try {
      let response: Response;
      try {
        response = await fetch(trimmed);
      } catch {
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(trimmed)}`;
        response = await fetch(proxyUrl);
      }

      if (!response.ok) {
        throw new Error(`Failed to download calendar feed (Status: ${response.status})`);
      }

      const text = await response.text();
      const count = importIcs(text);
      return count;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to import calendar feed';
      throw new Error(msg);
    }
  }, [importIcs]);

  // 10. Delete single event
  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // 11. Clear all Google-sourced events
  const clearGoogleEvents = useCallback(() => {
    setEvents((prev) => prev.filter((e) => e.source !== 'google'));
    setGoogleCalendarUrl('');
  }, []);

  const hasGoogleEvents = useMemo(() => {
    return events.some((e) => e.source === 'google');
  }, [events]);

  return {
    events,
    googleCalendarUrl,
    isLoaded,
    isSyncing,
    isGoogleConnected,
    isGoogleConfigured,
    hasGoogleEvents,
    syncGoogleCalendar,
    connectGoogleOAuth,
    disconnectGoogle,
    importIcs,
    importFromUrl,
    deleteEvent,
    clearGoogleEvents,
  };
}
