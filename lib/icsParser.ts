import { CalendarEvent, EventCategory } from '@/types/calendar';

function parseIcsDate(raw: string): { dateStr: string; timeStr: string } {
  // raw can be e.g. "20260916T093000Z", "20260916T093000", "20260916"
  const clean = raw.replace(/^.*:/, '').trim();

  if (clean.length < 8) {
    const now = new Date();
    return {
      dateStr: now.toISOString().split('T')[0],
      timeStr: 'All day',
    };
  }

  const yyyy = clean.substring(0, 4);
  const mm = clean.substring(4, 6);
  const dd = clean.substring(6, 8);
  const dateStr = `${yyyy}-${mm}-${dd}`;

  if (clean.includes('T') && clean.length >= 13) {
    const tIndex = clean.indexOf('T');
    const hh = parseInt(clean.substring(tIndex + 1, tIndex + 3), 10);
    const min = clean.substring(tIndex + 3, tIndex + 5);

    const period = hh >= 12 ? 'PM' : 'AM';
    const displayHour = hh % 12 === 0 ? 12 : hh % 12;
    const timeStr = `${String(displayHour).padStart(2, '0')}:${min} ${period}`;
    return { dateStr, timeStr };
  }

  return { dateStr, timeStr: 'All day' };
}

function categorizeEvent(title: string, desc: string): EventCategory {
  const combined = `${title} ${desc}`.toLowerCase();
  if (combined.includes('focus') || combined.includes('deep work') || combined.includes('code') || combined.includes('dev')) {
    return 'Focus';
  }
  if (combined.includes('sync') || combined.includes('meeting') || combined.includes('call') || combined.includes('1:1') || combined.includes('standup')) {
    return 'Meeting';
  }
  if (combined.includes('design') || combined.includes('figma') || combined.includes('ui') || combined.includes('ux')) {
    return 'Design';
  }
  if (combined.includes('gym') || combined.includes('workout') || combined.includes('run') || combined.includes('lunch') || combined.includes('dinner')) {
    return 'Personal';
  }
  return 'Work';
}

export function parseIcsContent(icsContent: string): CalendarEvent[] {
  // 1. Unfold lines (RFC 5545 specifies that lines starting with space/tab are continuation)
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
      if (current.SUMMARY) {
        const start = parseIcsDate(current.DTSTART || '');
        const end = parseIcsDate(current.DTEND || '');

        const title = current.SUMMARY.replace(/\\,/g, ',').replace(/\\;/g, ';').trim();
        const desc = (current.DESCRIPTION || '').replace(/\\n/g, '\n').replace(/\\,/g, ',').trim();
        const location = (current.LOCATION || '').replace(/\\,/g, ',').trim();

        events.push({
          id: `gcal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          title,
          startTime: start.timeStr,
          endTime: end.timeStr !== 'All day' ? end.timeStr : start.timeStr,
          date: start.dateStr,
          category: categorizeEvent(title, desc),
          description: desc || undefined,
          location: location || undefined,
          source: 'google',
          created_at: new Date().toISOString(),
        });
      }
    } else if (inEvent) {
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        const keyPart = trimmed.substring(0, colonIndex);
        const valPart = trimmed.substring(colonIndex + 1);

        // Normalize key (e.g. DTSTART;TZID=... -> DTSTART)
        const mainKey = keyPart.split(';')[0].toUpperCase();
        current[mainKey] = valPart;
      }
    }
  }

  return events;
}

export const SAMPLE_GOOGLE_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'sample-1',
    title: 'Google Meet: FocusDeck Architecture & Rust Tauri IPC',
    startTime: '09:30 AM',
    endTime: '10:30 AM',
    date: new Date().toISOString().split('T')[0],
    category: 'Work',
    description: 'Sprint planning and architecture review with the engineering team.',
    location: 'meet.google.com/xyz-abcd-efg',
    source: 'google',
  },
  {
    id: 'sample-2',
    title: 'Deep Work: Supabase Cloud Database & RLS Migration',
    startTime: '11:00 AM',
    endTime: '01:00 PM',
    date: new Date().toISOString().split('T')[0],
    category: 'Focus',
    description: 'Autonomous focus block for database schemas and authentication policies.',
    source: 'google',
  },
  {
    id: 'sample-3',
    title: 'Product Design Sync: Modern Tailwind Design System',
    startTime: '02:30 PM',
    endTime: '03:15 PM',
    date: new Date().toISOString().split('T')[0],
    category: 'Design',
    description: 'Review responsive dashboard layouts and color tokens.',
    location: 'Google Meet',
    source: 'google',
  },
  {
    id: 'sample-4',
    title: 'Evening Run / Gym Workout',
    startTime: '05:30 PM',
    endTime: '06:30 PM',
    date: new Date().toISOString().split('T')[0],
    category: 'Personal',
    description: 'Cardio & recovery session.',
    source: 'google',
  },
];
