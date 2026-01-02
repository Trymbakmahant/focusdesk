"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CalendarEvent } from '@/types/calendar';
import { parseIcsContent, SAMPLE_GOOGLE_CALENDAR_EVENTS } from '@/lib/icsParser';

export function useCalendar() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [googleCalendarUrl, setGoogleCalendarUrl] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Storage key scoped to authenticated user
  const storageKey = useMemo(() => {
    return user ? `focusdeck_calendar_${user.id}` : 'focusdeck_calendar_guest';
  }, [user]);

  const urlStorageKey = useMemo(() => {
    return user ? `focusdeck_gcal_url_${user.id}` : 'focusdeck_gcal_url_guest';
  }, [user]);

  // Load user calendar from localStorage
  useEffect(() => {
    if (!user) {
      setEvents([]);
      setIsLoaded(true);
      return;
    }

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
      // Fallback
    } finally {
      setIsLoaded(true);
    }
  }, [user, storageKey, urlStorageKey]);

  // Persist whenever events change
  useEffect(() => {
    if (!isLoaded || !user) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(events));
    } catch (err) {
      console.error('Failed to persist calendar events:', err);
    }
  }, [events, isLoaded, user, storageKey]);

  // Persist URL
  useEffect(() => {
    if (!isLoaded || !user) return;
    try {
      localStorage.setItem(urlStorageKey, googleCalendarUrl);
    } catch (err) {
      console.error('Failed to persist gcal url:', err);
    }
  }, [googleCalendarUrl, isLoaded, user, urlStorageKey]);

  // Import raw ICS string (from file upload or text)
  const importIcs = useCallback((icsContent: string) => {
    const parsed = parseIcsContent(icsContent);
    if (parsed.length === 0) {
      throw new Error('No valid calendar events found in this .ics content.');
    }

    setEvents((prev) => {
      // Remove existing google events and merge new ones
      const nonGoogle = prev.filter((e) => e.source !== 'google');
      return [...parsed, ...nonGoogle];
    });

    return parsed.length;
  }, []);

  // Import from Google Calendar iCal URL
  const importFromUrl = useCallback(async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) throw new Error('Please provide a valid Google Calendar URL');

    setGoogleCalendarUrl(trimmed);

    // Fetch feed (try direct or via cors fallback)
    try {
      let response: Response;
      try {
        response = await fetch(trimmed);
      } catch {
        // Fallback through public CORS proxy if browser blocks direct Google fetch
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(trimmed)}`;
        response = await fetch(proxyUrl);
      }

      if (!response.ok) {
        throw new Error(`Failed to download calendar feed (Status: ${response.status})`);
      }

      const text = await response.text();
      const count = importIcs(text);
      return count;
    } catch (err: any) {
      throw new Error(err.message || 'Unable to import Google Calendar feed. Ensure URL is public or use .ics file export.');
    }
  }, [importIcs]);

  // Quick preset sample import for testing
  const importSampleEvents = useCallback(() => {
    setEvents((prev) => {
      const nonGoogle = prev.filter((e) => e.source !== 'google');
      return [...SAMPLE_GOOGLE_CALENDAR_EVENTS, ...nonGoogle];
    });
    return SAMPLE_GOOGLE_CALENDAR_EVENTS.length;
  }, []);

  // Delete event
  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // Clear imported Google Calendar events
  const clearGoogleEvents = useCallback(() => {
    setEvents((prev) => prev.filter((e) => e.source !== 'google'));
    setGoogleCalendarUrl('');
  }, []);

  // Check if synced
  const hasGoogleEvents = useMemo(() => {
    return events.some((e) => e.source === 'google');
  }, [events]);

  return {
    events,
    googleCalendarUrl,
    isLoaded,
    hasGoogleEvents,
    importIcs,
    importFromUrl,
    importSampleEvents,
    deleteEvent,
    clearGoogleEvents,
  };
}
