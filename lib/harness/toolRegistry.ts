import { HarnessToolDefinition, ToolExecutionResult } from '@/types/harness';

// Custom Event Names for Harness Actions
export const HARNESS_EVENTS = {
  TIMER_COMMAND: 'focusdeck-timer-command',
  TASKS_COMMAND: 'focusdeck-tasks-command',
  NOTES_COMMAND: 'focusdeck-notes-command',
  REMINDERS_COMMAND: 'focusdeck-reminders-command',
  VIEWMODE_COMMAND: 'focusdeck-viewmode-command',
  DAILY_FOCUS_UPDATE: 'focusdeck-daily-focus-update',
  FOCUS_UPDATE: 'focusdeck-focus-update',
  HARNESS_ACTION_EXECUTED: 'focusdeck-harness-executed',
} as const;

function dispatchClientEvent(eventName: string, detail: Record<string, any>) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
    window.dispatchEvent(
      new CustomEvent(HARNESS_EVENTS.HARNESS_ACTION_EXECUTED, {
        detail: { eventName, detail, timestamp: Date.now() },
      })
    );
  }
}

export const FOCUSDECK_TOOL_REGISTRY: HarnessToolDefinition[] = [
  // ==========================================
  // 1. FOCUS TIMER TOOLS
  // ==========================================
  {
    name: 'timer_start',
    category: 'timer',
    description: 'Start a focus or break timer session in FocusDeck with a specified duration and mode.',
    parameters: {
      type: 'object',
      properties: {
        durationMinutes: {
          type: 'integer',
          description: 'Duration in minutes (1 to 180). Defaults to 25 for pomodoro or 45 for custom.',
          default: 25,
        },
        mode: {
          type: 'string',
          description: 'Timer mode: "pomodoro" (25m), "shortBreak" (5m), "longBreak" (15m), or "custom".',
          enum: ['pomodoro', 'shortBreak', 'longBreak', 'custom'],
          default: 'pomodoro',
        },
      },
      required: [],
    },
    voiceTriggers: [
      {
        pattern: /(?:start|begin|run)(?:\s+a)?\s+(?:focus\s+timer|timer|pomodoro)(?:\s+for\s+(\d+)\s+minutes?)?/i,
        example: 'start a focus timer for 30 minutes',
        extractParams: (match) => {
          if (Array.isArray(match) && match[1]) {
            return { durationMinutes: parseInt(match[1], 10), mode: 'custom' };
          }
          return { mode: 'pomodoro', durationMinutes: 25 };
        },
      },
      {
        pattern: /(?:start|take)(?:\s+a)?\s+(short|long)?\s*break(?:\s+for\s+(\d+)\s+minutes?)?/i,
        example: 'take a short break',
        extractParams: (match) => {
          const isLong = Array.isArray(match) && match[1]?.toLowerCase() === 'long';
          return { mode: isLong ? 'longBreak' : 'shortBreak' };
        },
      },
    ],
    execute: (params) => {
      const mode = params.mode || (params.durationMinutes ? 'custom' : 'pomodoro');
      const durationMinutes = params.durationMinutes ? Number(params.durationMinutes) : (mode === 'custom' ? 45 : 25);

      dispatchClientEvent(HARNESS_EVENTS.TIMER_COMMAND, {
        action: 'start',
        mode,
        durationMinutes,
      });

      return {
        success: true,
        message: `Started ${mode} timer for ${durationMinutes} minutes.`,
        data: { mode, durationMinutes, state: 'running' },
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'timer_pause',
    category: 'timer',
    description: 'Pause the currently active focus timer.',
    parameters: {
      type: 'object',
      properties: {},
    },
    voiceTriggers: [
      {
        pattern: /(?:pause|freeze|hold)(?:\s+the)?\s+(?:focus\s+timer|timer)/i,
        example: 'pause timer',
      },
    ],
    execute: () => {
      dispatchClientEvent(HARNESS_EVENTS.TIMER_COMMAND, { action: 'pause' });
      return {
        success: true,
        message: 'Focus timer paused.',
        data: { state: 'paused' },
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'timer_resume',
    category: 'timer',
    description: 'Resume a paused focus timer.',
    parameters: {
      type: 'object',
      properties: {},
    },
    voiceTriggers: [
      {
        pattern: /(?:resume|unpause|continue)(?:\s+the)?\s+(?:focus\s+timer|timer)/i,
        example: 'resume timer',
      },
    ],
    execute: () => {
      dispatchClientEvent(HARNESS_EVENTS.TIMER_COMMAND, { action: 'resume' });
      return {
        success: true,
        message: 'Focus timer resumed.',
        data: { state: 'running' },
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'timer_reset',
    category: 'timer',
    description: 'Reset the focus timer back to its initial time.',
    parameters: {
      type: 'object',
      properties: {},
    },
    voiceTriggers: [
      {
        pattern: /(?:reset|stop|restart)(?:\s+the)?\s+(?:focus\s+timer|timer)/i,
        example: 'reset focus timer',
      },
    ],
    execute: () => {
      dispatchClientEvent(HARNESS_EVENTS.TIMER_COMMAND, { action: 'reset' });
      return {
        success: true,
        message: 'Focus timer reset to initial duration.',
        data: { state: 'stopped' },
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'timer_set_target',
    category: 'timer',
    description: 'Set the user daily target focus goal in minutes (e.g., 120, 180, 240, 300, 360, 480).',
    parameters: {
      type: 'object',
      properties: {
        targetMinutes: {
          type: 'integer',
          description: 'Target goal in minutes (e.g. 240 for 4 hours, 300 for 5 hours).',
        },
      },
      required: ['targetMinutes'],
    },
    voiceTriggers: [
      {
        pattern: /set(?:\s+my)?\s+daily(?:\s+focus)?\s+target\s+to\s+(\d+)\s*(?:hours?|hrs?|h|minutes?|mins?|m)/i,
        example: 'set daily target to 4 hours',
        extractParams: (match) => {
          if (Array.isArray(match) && match[1]) {
            const raw = parseInt(match[1], 10);
            // If <= 12, assume hours
            const minutes = raw <= 12 ? raw * 60 : raw;
            return { targetMinutes: minutes };
          }
          return { targetMinutes: 240 };
        },
      },
    ],
    execute: (params) => {
      const minutes = Math.max(30, Math.min(1440, Number(params.targetMinutes)));
      if (typeof window !== 'undefined') {
        const goalKey = Object.keys(localStorage).find((k) => k.startsWith('focusdeck_focus_goal_')) || 'focusdeck_focus_goal_guest';
        localStorage.setItem(goalKey, JSON.stringify({ dailyTargetMinutes: minutes }));
        window.dispatchEvent(new CustomEvent(HARNESS_EVENTS.FOCUS_UPDATE));
      }
      return {
        success: true,
        message: `Daily focus target set to ${minutes} minutes (${(minutes / 60).toFixed(1)} hours).`,
        data: { targetMinutes: minutes },
        timestamp: Date.now(),
      };
    },
  },

  // ==========================================
  // 2. DAILY FOCUS INTENTION & WORKDAY TOOLS
  // ==========================================
  {
    name: 'focus_set_intention',
    category: 'focus',
    description: 'Set or update the primary focus objective ("What\'s your focus today?"), category, and average workday hours.',
    parameters: {
      type: 'object',
      properties: {
        intention: {
          type: 'string',
          description: 'The primary focus goal for today (e.g. "Ship Rust Tauri IPC module", "Fix AuthKit token rotation").',
        },
        category: {
          type: 'string',
          description: 'Focus category',
          enum: ['Deep Work', 'Engineering', 'Architecture', 'Design', 'Strategy', 'Research', 'Admin'],
          default: 'Deep Work',
        },
        workdayHours: {
          type: 'number',
          description: 'Average working day length in hours (e.g., 6, 7, 8, 9). Default is 8.',
          default: 8,
        },
      },
      required: ['intention'],
    },
    voiceTriggers: [
      {
        pattern: /(?:set|change)(?:\s+my)?\s+(?:daily\s+focus|focus)(?:\s+for)?(?:\s+today)?(?:\s+to)?\s+["']?([^"']+)["']?/i,
        example: "set my focus today to Ship Rust Tauri IPC",
        extractParams: (match) => {
          if (Array.isArray(match) && match[1]) {
            return { intention: match[1].trim() };
          }
          return { intention: 'Deep Work Session' };
        },
      },
    ],
    execute: (params) => {
      const intention = params.intention || 'Deep Work Session';
      const category = params.category || 'Deep Work';
      const workdayHours = params.workdayHours ? Number(params.workdayHours) : 8;

      if (typeof window !== 'undefined') {
        const today = new Date().toISOString().split('T')[0];
        const storageKey = Object.keys(localStorage).find((k) => k.startsWith('focusdeck_daily_focus_') && k.endsWith(today)) || `focusdeck_daily_focus_guest_${today}`;
        
        const payload = {
          focusIntention: intention,
          category,
          workdayHours,
          updatedAt: new Date().toISOString(),
        };

        localStorage.setItem(storageKey, JSON.stringify(payload));
        window.dispatchEvent(new CustomEvent(HARNESS_EVENTS.DAILY_FOCUS_UPDATE));
      }

      return {
        success: true,
        message: `Today's focus intention set to "${intention}" (${category}) based on an ${workdayHours}h workday.`,
        data: { intention, category, workdayHours },
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'focus_get_stats',
    category: 'focus',
    description: 'Retrieve current focus statistics: minutes logged today, target, progress percentage, and blocks completed.',
    parameters: {
      type: 'object',
      properties: {},
    },
    voiceTriggers: [
      {
        pattern: /(?:what(?:'s| is)|how much|check)(?:\s+is)?(?:\s+my)?\s+(?:focus|focus\s+time|progress|focus\s+stats)(?:\s+today)?/i,
        example: "what is my focus time today",
      },
    ],
    execute: () => {
      let todayMinutes = 0;
      let targetMinutes = 240;
      let completedSessions = 0;

      if (typeof window !== 'undefined') {
        const today = new Date().toISOString().split('T')[0];
        const recordsKey = Object.keys(localStorage).find((k) => k.startsWith('focusdeck_focus_records_'));
        if (recordsKey) {
          try {
            const parsed = JSON.parse(localStorage.getItem(recordsKey) || '{}');
            if (parsed[today]) {
              todayMinutes = Math.round((parsed[today].totalSeconds || 0) / 60);
              completedSessions = parsed[today].completedSessions || 0;
            }
          } catch {}
        }
        const goalKey = Object.keys(localStorage).find((k) => k.startsWith('focusdeck_focus_goal_'));
        if (goalKey) {
          try {
            const parsed = JSON.parse(localStorage.getItem(goalKey) || '{}');
            if (parsed.dailyTargetMinutes) targetMinutes = parsed.dailyTargetMinutes;
          } catch {}
        }
      }

      const progressPercent = Math.min(100, Math.round((todayMinutes / targetMinutes) * 100));

      return {
        success: true,
        message: `You have logged ${todayMinutes}m of your ${targetMinutes}m goal (${progressPercent}%) across ${completedSessions} sessions today.`,
        data: {
          todayMinutes,
          targetMinutes,
          progressPercent,
          completedSessions,
        },
        timestamp: Date.now(),
      };
    },
  },

  // ==========================================
  // 3. TASKS & TODO TOOLS
  // ==========================================
  {
    name: 'tasks_list',
    category: 'tasks',
    description: 'List user tasks with optional filter for completed or pending tasks.',
    parameters: {
      type: 'object',
      properties: {
        filter: {
          type: 'string',
          description: 'Task filter',
          enum: ['all', 'pending', 'completed', 'urgent'],
          default: 'all',
        },
      },
    },
    voiceTriggers: [
      {
        pattern: /(?:list|show|get|what are)(?:\s+my)?\s+(?:tasks|todos)/i,
        example: 'show my tasks',
      },
    ],
    execute: (params) => {
      let tasks: any[] = [];
      if (typeof window !== 'undefined') {
        const taskKey = Object.keys(localStorage).find((k) => k.startsWith('focusdeck_tasks_'));
        if (taskKey) {
          try {
            tasks = JSON.parse(localStorage.getItem(taskKey) || '[]');
          } catch {}
        }
      }

      const filter = params.filter || 'all';
      let filtered = tasks;
      if (filter === 'pending') filtered = tasks.filter((t) => !t.completed);
      if (filter === 'completed') filtered = tasks.filter((t) => t.completed);
      if (filter === 'urgent') filtered = tasks.filter((t) => t.importance === 'Urgent');

      return {
        success: true,
        message: `Found ${filtered.length} tasks (${filter}).`,
        data: { tasks: filtered, count: filtered.length },
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'tasks_create',
    category: 'tasks',
    description: 'Create a new task in FocusDeck.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Title or description of the task.',
        },
        importance: {
          type: 'string',
          description: 'Priority level: "Urgent", "High", "Medium", "Low".',
          enum: ['Urgent', 'High', 'Medium', 'Low'],
          default: 'Medium',
        },
        badge: {
          type: 'string',
          description: 'Category tag or badge (e.g. "Deep Work", "Engineering", "Design").',
          default: 'General',
        },
        dueDate: {
          type: 'string',
          description: 'Due date in YYYY-MM-DD format. Defaults to today.',
        },
      },
      required: ['title'],
    },
    voiceTriggers: [
      {
        pattern: /(?:add|create|new)(?:\s+a)?\s+task(?:\s+to|:)?\s+["']?([^"']+)["']?/i,
        example: 'add task review Rust IPC bridge',
        extractParams: (match) => {
          if (Array.isArray(match) && match[1]) {
            return { title: match[1].trim() };
          }
          return { title: 'New Task' };
        },
      },
    ],
    execute: (params) => {
      const title = params.title || 'Untitled Task';
      const importance = params.importance || 'Medium';
      const badge = params.badge || 'General';
      const dueDate = params.dueDate || new Date().toISOString().split('T')[0];

      const newTask = {
        id: `task_${Date.now()}`,
        title,
        completed: false,
        importance,
        badge,
        dueDate,
        createdAt: new Date().toISOString(),
      };

      if (typeof window !== 'undefined') {
        const taskKey = Object.keys(localStorage).find((k) => k.startsWith('focusdeck_tasks_')) || 'focusdeck_tasks_guest';
        let current: any[] = [];
        try {
          current = JSON.parse(localStorage.getItem(taskKey) || '[]');
        } catch {}
        current.unshift(newTask);
        localStorage.setItem(taskKey, JSON.stringify(current));

        dispatchClientEvent(HARNESS_EVENTS.TASKS_COMMAND, { action: 'created', task: newTask });
      }

      return {
        success: true,
        message: `Task created: "${title}".`,
        data: { task: newTask },
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'tasks_toggle',
    category: 'tasks',
    description: 'Toggle the completed state of a task by ID or partial title.',
    parameters: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'Unique ID of the task.',
        },
        titleQuery: {
          type: 'string',
          description: 'Case-insensitive search query to find the task by title if ID is not known.',
        },
      },
    },
    voiceTriggers: [
      {
        pattern: /(?:complete|finish|check off|mark done)(?:\s+the)?\s+task\s+["']?([^"']+)["']?/i,
        example: 'complete task review Rust IPC bridge',
        extractParams: (match) => {
          if (Array.isArray(match) && match[1]) {
            return { titleQuery: match[1].trim() };
          }
          return {};
        },
      },
    ],
    execute: (params) => {
      let matchedTask: any = null;

      if (typeof window !== 'undefined') {
        const taskKey = Object.keys(localStorage).find((k) => k.startsWith('focusdeck_tasks_'));
        if (taskKey) {
          try {
            const current = JSON.parse(localStorage.getItem(taskKey) || '[]');
            const index = current.findIndex(
              (t: any) =>
                (params.taskId && t.id === params.taskId) ||
                (params.titleQuery && t.title.toLowerCase().includes(params.titleQuery.toLowerCase()))
            );

            if (index !== -1) {
              current[index].completed = !current[index].completed;
              matchedTask = current[index];
              localStorage.setItem(taskKey, JSON.stringify(current));
              dispatchClientEvent(HARNESS_EVENTS.TASKS_COMMAND, { action: 'toggled', task: matchedTask });
            }
          } catch {}
        }
      }

      if (!matchedTask) {
        return {
          success: false,
          message: `No task found matching query "${params.taskId || params.titleQuery}".`,
          timestamp: Date.now(),
        };
      }

      return {
        success: true,
        message: `Task "${matchedTask.title}" marked as ${matchedTask.completed ? 'completed' : 'incomplete'}.`,
        data: { task: matchedTask },
        timestamp: Date.now(),
      };
    },
  },

  // ==========================================
  // 4. CALENDAR & EVENTS TOOLS
  // ==========================================
  {
    name: 'calendar_get_next_event',
    category: 'calendar',
    description: 'Retrieve the next scheduled calendar event or meeting with countdown.',
    parameters: {
      type: 'object',
      properties: {},
    },
    voiceTriggers: [
      {
        pattern: /(?:what(?:'s| is)|when is)(?:\s+my)?\s+(?:next\s+meeting|next\s+event|upcoming\s+event)/i,
        example: "what's my next meeting",
      },
    ],
    execute: () => {
      let events: any[] = [];
      if (typeof window !== 'undefined') {
        const calKey = Object.keys(localStorage).find((k) => k.startsWith('focusdeck_calendar_events_'));
        if (calKey) {
          try {
            events = JSON.parse(localStorage.getItem(calKey) || '[]');
          } catch {}
        }
      }

      const now = Date.now();
      const upcoming = events
        .filter((e) => e.timestamp > now)
        .sort((a, b) => a.timestamp - b.timestamp)[0];

      if (!upcoming) {
        return {
          success: true,
          message: 'No more upcoming events scheduled for today.',
          data: { nextEvent: null },
          timestamp: Date.now(),
        };
      }

      const diffMins = Math.max(1, Math.round((upcoming.timestamp - now) / 60000));
      return {
        success: true,
        message: `Next event: "${upcoming.title}" starting in ${diffMins} minutes (${upcoming.startTime}).`,
        data: { nextEvent: upcoming, minutesRemaining: diffMins },
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'calendar_get_events',
    category: 'calendar',
    description: 'List all calendar events for today.',
    parameters: {
      type: 'object',
      properties: {},
    },
    voiceTriggers: [
      {
        pattern: /(?:show|list|get)(?:\s+my)?\s+(?:calendar|meetings|events|schedule)(?:\s+today)?/i,
        example: 'show my schedule today',
      },
    ],
    execute: () => {
      let events: any[] = [];
      if (typeof window !== 'undefined') {
        const calKey = Object.keys(localStorage).find((k) => k.startsWith('focusdeck_calendar_events_'));
        if (calKey) {
          try {
            events = JSON.parse(localStorage.getItem(calKey) || '[]');
          } catch {}
        }
      }

      return {
        success: true,
        message: `Found ${events.length} calendar events today.`,
        data: { events, count: events.length },
        timestamp: Date.now(),
      };
    },
  },

  // ==========================================
  // 5. HABITS TRACKING TOOLS
  // ==========================================
  {
    name: 'habits_list',
    category: 'habits',
    description: 'List all tracked habits and their completion counts.',
    parameters: {
      type: 'object',
      properties: {},
    },
    voiceTriggers: [
      {
        pattern: /(?:show|list|get)(?:\s+my)?\s+habits/i,
        example: 'show my habits',
      },
    ],
    execute: () => {
      let habits: any[] = [];
      if (typeof window !== 'undefined') {
        const habitKey = Object.keys(localStorage).find((k) => k.startsWith('focusdeck_habits_'));
        if (habitKey) {
          try {
            habits = JSON.parse(localStorage.getItem(habitKey) || '[]');
          } catch {}
        }
      }

      return {
        success: true,
        message: `Retrieved ${habits.length} habits.`,
        data: { habits },
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'habits_increment',
    category: 'habits',
    description: 'Log completion or increment count for a habit (e.g. Drink Water, Stretch, Walk).',
    parameters: {
      type: 'object',
      properties: {
        habitName: {
          type: 'string',
          description: 'Name or partial title of the habit (e.g. "Water", "Coffee", "Exercise").',
        },
      },
      required: ['habitName'],
    },
    voiceTriggers: [
      {
        pattern: /(?:drank|log|increment|record)(?:\s+some)?\s+(?:habit\s+)?([a-zA-Z\s]+)/i,
        example: 'log water',
        extractParams: (match) => {
          if (Array.isArray(match) && match[1]) {
            return { habitName: match[1].trim() };
          }
          return { habitName: 'Water' };
        },
      },
    ],
    execute: (params) => {
      const query = (params.habitName || '').toLowerCase();
      let matched: any = null;

      if (typeof window !== 'undefined') {
        const habitKey = Object.keys(localStorage).find((k) => k.startsWith('focusdeck_habits_'));
        if (habitKey) {
          try {
            const habits = JSON.parse(localStorage.getItem(habitKey) || '[]');
            const idx = habits.findIndex((h: any) => h.title.toLowerCase().includes(query));
            if (idx !== -1) {
              habits[idx].countToday = (habits[idx].countToday || 0) + 1;
              matched = habits[idx];
              localStorage.setItem(habitKey, JSON.stringify(habits));
              dispatchClientEvent('focusdeck-habits-updated', { habit: matched });
            }
          } catch {}
        }
      }

      if (!matched) {
        return {
          success: false,
          message: `Could not find habit matching "${params.habitName}".`,
          timestamp: Date.now(),
        };
      }

      return {
        success: true,
        message: `Logged 1 unit for habit "${matched.title}" (Total today: ${matched.countToday}).`,
        data: { habit: matched },
        timestamp: Date.now(),
      };
    },
  },

  // ==========================================
  // 6. QUICK NOTES TOOLS
  // ==========================================
  {
    name: 'notes_get',
    category: 'notes',
    description: 'Retrieve the current Quick Note content.',
    parameters: {
      type: 'object',
      properties: {},
    },
    voiceTriggers: [
      {
        pattern: /(?:read|show|get|what is)(?:\s+in)?(?:\s+my)?\s+quick\s+note/i,
        example: 'read my quick note',
      },
    ],
    execute: () => {
      let content = '';
      if (typeof window !== 'undefined') {
        content = localStorage.getItem('focusdeck_quicknote_content') || '';
      }
      return {
        success: true,
        message: content ? `Note: "${content.slice(0, 80)}..."` : 'Quick note is currently empty.',
        data: { content },
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'notes_append',
    category: 'notes',
    description: 'Append text to the Quick Note pad.',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Text to append to note.',
        },
      },
      required: ['text'],
    },
    voiceTriggers: [
      {
        pattern: /(?:add|append|write)(?:\s+to)?\s+quick\s+note(?::|\s+that|\s+)?\s+["']?([^"']+)["']?/i,
        example: 'add to quick note: remember to push branch',
        extractParams: (match) => {
          if (Array.isArray(match) && match[1]) {
            return { text: match[1].trim() };
          }
          return { text: '' };
        },
      },
    ],
    execute: (params) => {
      const text = params.text || '';
      if (!text) {
        return { success: false, message: 'No text provided to append to note.', timestamp: Date.now() };
      }

      let newContent = text;
      if (typeof window !== 'undefined') {
        const existing = localStorage.getItem('focusdeck_quicknote_content') || '';
        newContent = existing ? `${existing}\n- ${text}` : text;
        localStorage.setItem('focusdeck_quicknote_content', newContent);
        dispatchClientEvent(HARNESS_EVENTS.NOTES_COMMAND, { content: newContent });
      }

      return {
        success: true,
        message: `Appended to note: "${text}".`,
        data: { content: newContent },
        timestamp: Date.now(),
      };
    },
  },

  // ==========================================
  // 7. REMINDERS TOOLS
  // ==========================================
  {
    name: 'reminders_create',
    category: 'reminders',
    description: 'Create a new reminder with title and scheduled time.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Reminder description (e.g. "Submit invoice", "Hydrate").',
        },
        time: {
          type: 'string',
          description: 'Scheduled time (e.g. "03:30 PM", "in 30 minutes").',
        },
      },
      required: ['title'],
    },
    voiceTriggers: [
      {
        pattern: /(?:remind me to|create reminder to)\s+([^at|in]+)(?:\s+at|\s+in\s+)?(.*)?/i,
        example: 'remind me to stand up at 4:00 PM',
        extractParams: (match) => {
          if (Array.isArray(match) && match[1]) {
            return {
              title: match[1].trim(),
              time: match[2]?.trim() || 'Today',
            };
          }
          return { title: 'New Reminder', time: 'Today' };
        },
      },
    ],
    execute: (params) => {
      const reminder = {
        id: `rem_${Date.now()}`,
        title: params.title || 'Untitled Reminder',
        time: params.time || '12:00 PM',
        completed: false,
      };

      if (typeof window !== 'undefined') {
        dispatchClientEvent(HARNESS_EVENTS.REMINDERS_COMMAND, {
          action: 'create',
          reminder,
        });
      }

      return {
        success: true,
        message: `Created reminder: "${reminder.title}" at ${reminder.time}.`,
        data: { reminder },
        timestamp: Date.now(),
      };
    },
  },

  // ==========================================
  // 8. DASHBOARD UI & NAVIGATION TOOLS
  // ==========================================
  {
    name: 'ui_set_view_mode',
    category: 'ui',
    description: 'Switch the dashboard layout view mode between Bento "canvas" and chronological "feed".',
    parameters: {
      type: 'object',
      properties: {
        mode: {
          type: 'string',
          description: 'Target layout view mode.',
          enum: ['canvas', 'feed'],
        },
      },
      required: ['mode'],
    },
    voiceTriggers: [
      {
        pattern: /(?:switch|change)(?:\s+to)?\s+(canvas|feed)(?:\s+view|\s+mode)?/i,
        example: 'switch to feed view',
        extractParams: (match) => {
          if (Array.isArray(match) && match[1]) {
            return { mode: match[1].toLowerCase() };
          }
          return { mode: 'canvas' };
        },
      },
    ],
    execute: (params) => {
      const mode = params.mode === 'feed' ? 'feed' : 'canvas';
      dispatchClientEvent(HARNESS_EVENTS.VIEWMODE_COMMAND, { mode });

      if (typeof window !== 'undefined') {
        localStorage.setItem('focusdeck_view_mode', mode);
      }

      return {
        success: true,
        message: `Dashboard layout switched to ${mode.toUpperCase()} mode.`,
        data: { mode },
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'ui_get_view_mode',
    category: 'ui',
    description: 'Get the currently active layout view mode (canvas or feed).',
    parameters: {
      type: 'object',
      properties: {},
    },
    voiceTriggers: [
      {
        pattern: /(?:what is|which)\s+(?:view|mode|layout)(?:\s+is\s+active)?/i,
        example: 'what view is active',
      },
    ],
    execute: () => {
      let mode = 'canvas';
      if (typeof window !== 'undefined') {
        mode = localStorage.getItem('focusdeck_view_mode') || 'canvas';
      }
      return {
        success: true,
        message: `Current view mode is "${mode}".`,
        data: { mode },
        timestamp: Date.now(),
      };
    },
  },
];
