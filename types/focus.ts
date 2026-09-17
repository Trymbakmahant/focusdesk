export interface DailyFocusRecord {
  date: string; // YYYY-MM-DD
  totalSeconds: number; // total focus seconds today
  completedSessions: number; // count of completed focus blocks
  lastSessionSeconds?: number;
}

export interface FocusGoalSettings {
  dailyTargetMinutes: number; // default: 300 (5 hours)
}
