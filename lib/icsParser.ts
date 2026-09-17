import { CalendarEvent, EventCategory } from '@/types/calendar';

interface ParsedDateResult {
  dateStr: string;
  timeStr: string;
  timestamp: number;
}

function parseIcsDateTime(raw: string): ParsedDateResult {
  const clean = raw.replace(/^.*:/, '').trim();

  if (clean.length < 8) {
    const now = new Date();
    return {
      dateStr: now.toISOString().split('T')[0],
      timeStr: 'All day',
      timestamp: now.getTime(),
    };
  }

  // All-day date format: YYYYMMDD
  if (!clean.includes('T')) {
    const y = clean.substring(0, 4);
    const m = clean.substring(4, 6);
    const d = clean.substring(6, 8);
    const localDt = new Date(`${y}-${m}-${d}T00:00:00`);

    const year = localDt.getFullYear();
    const month = String(localDt.getMonth() + 1).padStart(2, '0');
    const day = String(localDt.getDate()).padStart(2, '0');

    return {
      dateStr: `${year}-${month}-${day}`,
      timeStr: 'All day',
      timestamp: localDt.getTime(),
    };
  }

  // DateTime format: YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
  const isUtc = clean.endsWith('Z');
  const numericPart = clean.replace('Z', '');
  const y = numericPart.substring(0, 4);
  const m = numericPart.substring(4, 6);
  const d = numericPart.substring(6, 8);

  const tIndex = numericPart.indexOf('T');
  const hh = numericPart.substring(tIndex + 1, tIndex + 3) || '00';
  const min = numericPart.substring(tIndex + 3, tIndex + 5) || '00';
  const ss = numericPart.substring(tIndex + 5, tIndex + 7) || '00';

  const isoString = isUtc
    ? `${y}-${m}-${d}T${hh}:${min}:${ss}Z`
    : `${y}-${m}-${d}T${hh}:${min}:${ss}`;

  const dt = new Date(isoString);

  // Use user's local timezone
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  const timeStr = dt.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return {
    dateStr,
    timeStr,
    timestamp: dt.getTime(),
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .trim();
}

function extractMeetingUrl(text: string, location: string): string | undefined {
  const combined = `${location} ${text}`;
  const match = combined.match(/https?:\/\/(meet\.google\.com|zoom\.us|teams\.microsoft\.com)\/[^\s<>"']+/i);
  return match ? match[0] : undefined;
}

function categorizeEvent(title: string, desc: string): EventCategory {
  const combined = `${title} ${desc}`.toLowerCase();
  if (
    combined.includes('focus') ||
    combined.includes('deep work') ||
    combined.includes('code') ||
    combined.includes('dev') ||
    combined.includes('hackathon') ||
    combined.includes('lab')
  ) {
    return 'Focus';
  }
  if (
    combined.includes('sync') ||
    combined.includes('meeting') ||
    combined.includes('call') ||
    combined.includes('1:1') ||
    combined.includes('standup') ||
    combined.includes('kickoff')
  ) {
    return 'Meeting';
  }
  if (
    combined.includes('design') ||
    combined.includes('figma') ||
    combined.includes('ui') ||
    combined.includes('ux') ||
    combined.includes('review')
  ) {
    return 'Design';
  }
  if (
    combined.includes('gym') ||
    combined.includes('workout') ||
    combined.includes('run') ||
    combined.includes('lunch') ||
    combined.includes('dinner') ||
    combined.includes('doctor')
  ) {
    return 'Personal';
  }
  return 'Work';
}

export function parseIcsContent(icsContent: string): CalendarEvent[] {
  // 1. Unfold lines according to RFC 5545
  const unfolded = icsContent.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
  const lines = unfolded.split(/\r\n|\r|\n/);

  const events: CalendarEvent[] = [];
  let inEvent = false;
  let current: Partial<Record<string, string>> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === 'BEGIN:VEVENT') {
      inEvent = true;
      current = {};
    } else if (trimmed === 'END:VEVENT') {
      inEvent = false;
      if (current.SUMMARY && current.DTSTART) {
        const start = parseIcsDateTime(current.DTSTART || '');
        const end = current.DTEND ? parseIcsDateTime(current.DTEND) : start;

        const rawTitle = current.SUMMARY.replace(/\\,/g, ',').replace(/\\;/g, ';').trim();
        const rawDesc = (current.DESCRIPTION || '').replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';');
        const cleanDesc = stripHtml(rawDesc);
        const rawLocation = (current.LOCATION || '').replace(/\\,/g, ',').replace(/\\;/g, ';').trim();

        const meetingUrl = extractMeetingUrl(cleanDesc, rawLocation) || (current.URL ? current.URL.trim() : undefined);

        events.push({
          id: current.UID ? `gcal-${current.UID}` : `gcal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          title: rawTitle,
          startTime: start.timeStr,
          endTime: end.timeStr !== 'All day' ? end.timeStr : start.timeStr,
          date: start.dateStr,
          timestamp: start.timestamp,
          endTimestamp: end.timestamp,
          category: categorizeEvent(rawTitle, cleanDesc),
          description: cleanDesc || undefined,
          location: rawLocation || undefined,
          url: meetingUrl,
          source: 'google',
          created_at: new Date().toISOString(),
        });
      }
    } else if (inEvent) {
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        const keyPart = trimmed.substring(0, colonIndex);
        const valPart = trimmed.substring(colonIndex + 1);

        const mainKey = keyPart.split(';')[0].toUpperCase();
        current[mainKey] = valPart;
      }
    }
  }

  // Sort events chronologically by start timestamp ascending
  return events.sort((a, b) => a.timestamp - b.timestamp);
}
