export interface DailyFocusRecord {
  date: string; // YYYY-MM-DD
  totalSeconds: number; // total focus seconds today
  completedSessions: number; // count of completed focus blocks
  lastSessionSeconds?: number;
}

export interface FocusGoalSettings {
  dailyTargetMinutes: number; // default: 300 (5 hours)
}

export type FocusCategory =
  | 'Deep Work'
  | 'Engineering'
  | 'Architecture'
  | 'Design'
  | 'Strategy'
  | 'Research'
  | 'Admin';

export interface DailyFocusIntention {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD
  focusIntention: string;
  category: FocusCategory | string;
  workdayHours: number; // e.g. 8.0 hours
  targetMinutes: number; // e.g. 240 minutes (4h)
  actualMinutes: number; // logged focus minutes today
  completedSessions: number;
  updatedAt?: string;
}

