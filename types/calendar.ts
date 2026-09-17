export type EventCategory = 'Work' | 'Meeting' | 'Focus' | 'Personal' | 'Design';

export interface CalendarEvent {
  id: string;
  user_id?: string;
  title: string;
  startTime: string; // e.g. "09:30 AM" or "All day"
  endTime: string;   // e.g. "10:30 AM" or "All day"
  date: string;      // "YYYY-MM-DD" local date
  timestamp: number; // Unix timestamp ms for exact sorting
  endTimestamp?: number;
  category: EventCategory;
  description?: string;
  location?: string;
  url?: string;
  source: 'google' | 'manual';
  created_at?: string;
}

export const CATEGORY_COLORS: Record<
  EventCategory,
  { bg: string; text: string; dot: string; border: string }
> = {
  Work: {
    bg: 'bg-sky-500/15',
    text: 'text-sky-600 dark:text-sky-400',
    dot: 'bg-sky-500',
    border: 'border-sky-500/30',
  },
  Meeting: {
    bg: 'bg-purple-500/15',
    text: 'text-purple-600 dark:text-purple-400',
    dot: 'bg-purple-500',
    border: 'border-purple-500/30',
  },
  Focus: {
    bg: 'bg-blue-500/15',
    text: 'text-[#007AFF] dark:text-[#0A84FF]',
    dot: 'bg-[#007AFF]',
    border: 'border-blue-500/30',
  },
  Personal: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    border: 'border-emerald-500/30',
  },
  Design: {
    bg: 'bg-rose-500/15',
    text: 'text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
    border: 'border-rose-500/30',
  },
};
