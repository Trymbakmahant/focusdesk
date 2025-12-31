export type ImportanceLevel = 'Urgent' | 'High' | 'Medium' | 'Low';

export const IMPORTANCE_WEIGHTS: Record<ImportanceLevel, number> = {
  Urgent: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export const IMPORTANCE_CONFIG: Record<
  ImportanceLevel,
  { label: string; badgeClass: string; dotClass: string; icon: string }
> = {
  Urgent: {
    label: 'Urgent',
    badgeClass: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    dotClass: 'bg-rose-500',
    icon: 'priority_high',
  },
  High: {
    label: 'High',
    badgeClass: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    dotClass: 'bg-amber-500',
    icon: 'arrow_upward',
  },
  Medium: {
    label: 'Medium',
    badgeClass: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
    dotClass: 'bg-sky-500',
    icon: 'remove',
  },
  Low: {
    label: 'Low',
    badgeClass: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
    dotClass: 'bg-slate-400',
    icon: 'arrow_downward',
  },
};

export interface BadgeItem {
  id: string;
  name: string;
  color: string; // Tailwind background or hex
  textColor: string;
  borderColor: string;
}

export const PRESET_BADGE_COLORS = [
  { name: 'Emerald', color: 'bg-emerald-500/20', textColor: 'text-emerald-300', borderColor: 'border-emerald-500/40', previewHex: '#10b981' },
  { name: 'Purple', color: 'bg-purple-500/20', textColor: 'text-purple-300', borderColor: 'border-purple-500/40', previewHex: '#a855f7' },
  { name: 'Sky', color: 'bg-sky-500/20', textColor: 'text-sky-300', borderColor: 'border-sky-500/40', previewHex: '#0ea5e9' },
  { name: 'Amber', color: 'bg-amber-500/20', textColor: 'text-amber-300', borderColor: 'border-amber-500/40', previewHex: '#f59e0b' },
  { name: 'Rose', color: 'bg-rose-500/20', textColor: 'text-rose-300', borderColor: 'border-rose-500/40', previewHex: '#f43f5e' },
  { name: 'Indigo', color: 'bg-indigo-500/20', textColor: 'text-indigo-300', borderColor: 'border-indigo-500/40', previewHex: '#6366f1' },
  { name: 'Teal', color: 'bg-teal-500/20', textColor: 'text-teal-300', borderColor: 'border-teal-500/40', previewHex: '#14b8a6' },
  { name: 'Orange', color: 'bg-orange-500/20', textColor: 'text-orange-300', borderColor: 'border-orange-500/40', previewHex: '#f97316' },
];

export const INITIAL_BADGE_BOX: BadgeItem[] = [
  { id: 'b-work', name: 'Work', color: 'bg-sky-500/20', textColor: 'text-sky-300', borderColor: 'border-sky-500/40' },
  { id: 'b-code', name: 'Code', color: 'bg-purple-500/20', textColor: 'text-purple-300', borderColor: 'border-purple-500/40' },
  { id: 'b-focus', name: 'Focus', color: 'bg-emerald-500/20', textColor: 'text-emerald-300', borderColor: 'border-emerald-500/40' },
  { id: 'b-design', name: 'Design', color: 'bg-rose-500/20', textColor: 'text-rose-300', borderColor: 'border-rose-500/40' },
  { id: 'b-personal', name: 'Personal', color: 'bg-amber-500/20', textColor: 'text-amber-300', borderColor: 'border-amber-500/40' },
];

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  importance: ImportanceLevel;
  badge?: string; // Badge name or badge id
  dueDate: string; // YYYY-MM-DD
  createdAt: string;
}
