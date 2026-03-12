export type MemoryCategory = 'fact' | 'preference' | 'lesson' | 'note' | 'project_context';

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';

export type DecisionStatus = 'active' | 'superseded' | 'deprecated';
export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived';

export interface SecondBrainProject {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description?: string | null;
  status: ProjectStatus;
  color?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SecondBrainSource {
  id: string;
  userId: string;
  type: 'claude' | 'cursor' | 'chatgpt' | 'gemini' | 'grok' | 'manual' | 'import' | 'system';
  externalId?: string | null;
  title?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface SecondBrainMemory {
  id: string;
  userId: string;
  content: string;
  contentHash: string;
  category: MemoryCategory;
  importance: number; // 1 - 5
  projectId?: string | null;
  sourceId?: string | null;
  sourceType?: string | null;
  embedding?: number[] | null;
  supersededById?: string | null;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface SecondBrainTask {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  projectId?: string | null;
  sourceId?: string | null;
  completedAt?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface SecondBrainDecision {
  id: string;
  userId: string;
  title: string;
  rationale: string;
  implications?: string | null;
  status: DecisionStatus;
  projectId?: string | null;
  supersededById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SecondBrainApiToken {
  id: string;
  userId: string;
  name: string;
  tokenHint: string;
  lastUsedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  revokedAt?: string | null;
}

export interface SecondBrainAuditLog {
  id: string;
  userId: string;
  clientType: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  details?: Record<string, any>;
  createdAt: string;
}

export interface DailyBriefingData {
  date: string;
  topPriorities: Array<{
    id: string;
    title: string;
    priority: TaskPriority;
    dueDate: string;
    status: TaskStatus;
    projectName?: string;
  }>;
  overdueTasks: Array<{
    id: string;
    title: string;
    priority: TaskPriority;
    dueDate: string;
  }>;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    priority: TaskPriority;
    dueDate: string;
    daysRemaining: number;
  }>;
  recentDecisions: Array<{
    id: string;
    title: string;
    rationale: string;
    createdAt: string;
  }>;
  activeContextNotes: Array<{
    id: string;
    content: string;
    category: MemoryCategory;
  }>;
  summaryText: string;
}

export interface ExtractedCandidate {
  id: string;
  type: 'memory' | 'task' | 'decision';
  category?: MemoryCategory;
  title?: string;
  content: string;
  rationale?: string;
  priority?: TaskPriority;
  dueDate?: string;
  confidence: number;
  approved: boolean;
}
