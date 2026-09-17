import { CalendarEvent } from '@/types/calendar';

export type EventStatus = 'finished' | 'ongoing' | 'upcoming';

/**
 * Calculates the exact end timestamp (in ms) for an event.
 * Falls back to 1 hour after start timestamp if endTimestamp is not set.
 * For all-day events, returns end of the date (23:59:59.999 local).
 */
export function getEventEndTime(event: CalendarEvent): number {
  if (event.endTimestamp && event.endTimestamp > 0) {
    return event.endTimestamp;
  }

  // If all-day event
  if (event.startTime === 'All day' || event.endTime === 'All day') {
    const parts = event.date.split('-').map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      return new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999).getTime();
    }
  }

  // Default fallback: 1 hour (3600000ms) after start timestamp
  return event.timestamp + 3600000;
}

/**
 * Returns the status of an event relative to the given timestamp (`now`).
 * - 'finished': event end time is in the past
 * - 'ongoing': current time is between event start and end time
 * - 'upcoming': event start time is in the future
 */
export function getEventStatus(
  event: CalendarEvent,
  now: number = Date.now()
): EventStatus {
  // Check for all-day events by local date
  if (event.startTime === 'All day' || event.endTime === 'All day') {
    const today = new Date(now);
    const todayDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    if (event.date < todayDateStr) {
      return 'finished';
    }
    if (event.date === todayDateStr) {
      return 'ongoing';
    }
    return 'upcoming';
  }

  const end = getEventEndTime(event);

  if (now >= end) {
    return 'finished';
  }
  if (now >= event.timestamp && now < end) {
    return 'ongoing';
  }
  return 'upcoming';
}

export function isEventFinished(event: CalendarEvent, now: number = Date.now()): boolean {
  return getEventStatus(event, now) === 'finished';
}

export function isEventOngoing(event: CalendarEvent, now: number = Date.now()): boolean {
  return getEventStatus(event, now) === 'ongoing';
}

export function isEventUpcoming(event: CalendarEvent, now: number = Date.now()): boolean {
  return getEventStatus(event, now) === 'upcoming';
}
