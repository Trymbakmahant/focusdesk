import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  SecondBrainMemory,
  SecondBrainTask,
  SecondBrainProject,
  SecondBrainDecision,
  SecondBrainApiToken,
  SecondBrainSource,
  SecondBrainAuditLog,
  DailyBriefingData,
  ExtractedCandidate,
  MemoryCategory,
  TaskPriority,
  TaskStatus,
  ProjectStatus,
  DecisionStatus,
} from '@/types/second-brain';
import { supabase } from '@/lib/supabase';

interface SecondBrainDbState {
  projects: SecondBrainProject[];
  sources: SecondBrainSource[];
  memories: SecondBrainMemory[];
  tasks: SecondBrainTask[];
  decisions: SecondBrainDecision[];
  apiTokens: (SecondBrainApiToken & { tokenHash: string })[];
  auditLogs: SecondBrainAuditLog[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'second_brain.json');

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

class SecondBrainService {
  private state: SecondBrainDbState = {
    projects: [],
    sources: [],
    memories: [],
    tasks: [],
    decisions: [],
    apiTokens: [],
    auditLogs: [],
  };

  private isLoaded = false;

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.state = {
          projects: parsed.projects || [],
          sources: parsed.sources || [],
          memories: parsed.memories || [],
          tasks: parsed.tasks || [],
          decisions: parsed.decisions || [],
          apiTokens: parsed.apiTokens || [],
          auditLogs: parsed.auditLogs || [],
        };
      } else {
        this.seedInitialData();
        this.saveState();
      }
    } catch (err) {
      console.warn('[SecondBrainService] File load warning:', err);
    }
    this.isLoaded = true;
  }

  private saveState() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.error('[SecondBrainService] File save error:', err);
    }
  }

  private seedInitialData() {
    const demoUserId = 'user_default';
    const projId = 'proj_' + crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();

    this.state.projects.push({
      id: projId,
      userId: demoUserId,
      name: 'Focus Desk Core',
      slug: 'focus-desk-core',
      description: 'Core application workspace and macOS desktop client',
      status: 'active',
      color: '#007AFF',
      createdAt: now,
      updatedAt: now,
    });

    const sourceId = 'src_' + crypto.randomUUID().slice(0, 8);
    this.state.sources.push({
      id: sourceId,
      userId: demoUserId,
      type: 'system',
      title: 'Initial Onboarding',
      createdAt: now,
    });

    this.state.memories.push(
      {
        id: 'mem_' + crypto.randomUUID().slice(0, 8),
        userId: demoUserId,
        content: 'Fixates uses a dark-first macOS Sequoia native interface with vibrant accents.',
        contentHash: sha256('Fixates uses a dark-first macOS Sequoia native interface with vibrant accents.'.trim().toLowerCase()),
        category: 'fact',
        importance: 4,
        projectId: projId,
        sourceId,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'mem_' + crypto.randomUUID().slice(0, 8),
        userId: demoUserId,
        content: 'User prefers concise, bulleted responses without redundant conversational preambles.',
        contentHash: sha256('User prefers concise, bulleted responses without redundant conversational preambles.'.trim().toLowerCase()),
        category: 'preference',
        importance: 5,
        projectId: null,
        sourceId,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }
    );

    this.state.decisions.push({
      id: 'dec_' + crypto.randomUUID().slice(0, 8),
      userId: demoUserId,
      title: 'Adopt dedicated second_brain PostgreSQL schema',
      rationale: 'Isolates AI memory and execution tables from standard Focus Desk tables to eliminate collision risks.',
      implications: 'Seamless migration path and independent maintenance.',
      status: 'active',
      projectId: projId,
      createdAt: now,
      updatedAt: now,
    });

    this.state.tasks.push({
      id: 'task_' + crypto.randomUUID().slice(0, 8),
      userId: demoUserId,
      title: 'Review Second Brain MCP memory layer integration',
      description: 'Verify Claude Desktop and Cursor can search memories and create tasks.',
      status: 'todo',
      priority: 'urgent',
      dueDate: getTodayString(),
      projectId: projId,
      createdAt: now,
      updatedAt: now,
    });
  }

  // ============================================================================
  // AUDIT LOGGING
  // ============================================================================
  private logAudit(
    userId: string,
    clientType: string,
    action: string,
    targetType: string,
    targetId?: string | null,
    details?: Record<string, any>
  ) {
    const entry: SecondBrainAuditLog = {
      id: crypto.randomUUID(),
      userId,
      clientType,
      action,
      targetType,
      targetId: targetId || null,
      details: details || {},
      createdAt: new Date().toISOString(),
    };
    this.state.auditLogs.unshift(entry);
    if (this.state.auditLogs.length > 500) {
      this.state.auditLogs.pop();
    }
    this.saveState();
  }

  // ============================================================================
  // TOKEN MANAGEMENT
  // ============================================================================
  public generateApiToken(userId: string, name: string): {
    rawToken: string;
    token: SecondBrainApiToken;
  } {
    const randomHex = crypto.randomBytes(24).toString('base64url');
    const rawToken = `sb_live_${randomHex}`;
    const tokenHash = sha256(rawToken);
    const tokenHint = `sb_live_...${rawToken.slice(-6)}`;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const tokenRecord = {
      id,
      userId,
      name: name.trim() || 'AI Client',
      tokenHash,
      tokenHint,
      lastUsedAt: null,
      expiresAt: null,
      createdAt: now,
      revokedAt: null,
    };

    this.state.apiTokens.unshift(tokenRecord);
    this.logAudit(userId, 'web:settings', 'token.create', 'token', id, { name });
    this.saveState();

    return {
      rawToken,
      token: {
        id,
        userId,
        name: tokenRecord.name,
        tokenHint,
        lastUsedAt: null,
        expiresAt: null,
        createdAt: now,
        revokedAt: null,
      },
    };
  }

  public validateToken(rawToken: string): {
    valid: boolean;
    userId: string;
    tokenName?: string;
  } | null {
    if (!rawToken || !rawToken.startsWith('sb_live_')) {
      return null;
    }

    const hash = sha256(rawToken.trim());
    const token = this.state.apiTokens.find((t) => t.tokenHash === hash);

    if (!token) {
      return null;
    }

    if (token.revokedAt) {
      return null;
    }

    if (token.expiresAt && new Date(token.expiresAt).getTime() < Date.now()) {
      return null;
    }

    // Touch last used
    token.lastUsedAt = new Date().toISOString();
    this.saveState();

    return {
      valid: true,
      userId: token.userId,
      tokenName: token.name,
    };
  }

  public listApiTokens(userId: string): SecondBrainApiToken[] {
    return this.state.apiTokens
      .filter((t) => t.userId === userId)
      .map(({ tokenHash, ...rest }) => rest);
  }

  public revokeApiToken(userId: string, tokenId: string): boolean {
    const token = this.state.apiTokens.find(
      (t) => t.id === tokenId && t.userId === userId
    );
    if (!token) return false;
    token.revokedAt = new Date().toISOString();
    this.logAudit(userId, 'web:settings', 'token.revoke', 'token', tokenId);
    this.saveState();
    return true;
  }

  // ============================================================================
  // MEMORY ENGINE
  // ============================================================================
  public saveMemory(
    userId: string,
    clientType: string,
    data: {
      content: string;
      category?: MemoryCategory;
      importance?: number;
      projectName?: string;
      projectId?: string;
      source?: string;
      externalId?: string;
    }
  ): { memory: SecondBrainMemory; isDuplicate: boolean } {
    const content = data.content.trim();
    if (!content) {
      throw new Error('Memory content cannot be empty.');
    }

    const normalized = content.toLowerCase().replace(/\s+/g, ' ');
    const contentHash = sha256(normalized);
    const now = new Date().toISOString();

    // Deduplication check
    const existing = this.state.memories.find(
      (m) => m.userId === userId && m.contentHash === contentHash && m.isActive
    );

    if (existing) {
      existing.updatedAt = now;
      if (data.importance && data.importance > existing.importance) {
        existing.importance = Math.min(5, Math.max(1, data.importance));
      }
      this.logAudit(userId, clientType, 'memory.save_duplicate', 'memory', existing.id, {
        content: content.slice(0, 80),
      });
      this.saveState();
      return { memory: existing, isDuplicate: true };
    }

    // Resolve project if specified by name or id
    let resolvedProjectId = data.projectId || null;
    if (!resolvedProjectId && data.projectName) {
      const proj = this.getOrCreateProject(userId, data.projectName);
      resolvedProjectId = proj.id;
    }

    // Resolve source
    const sourceRecord: SecondBrainSource = {
      id: crypto.randomUUID(),
      userId,
      type: (data.source as any) || 'manual',
      externalId: data.externalId || null,
      title: data.source ? `Captured via ${data.source}` : 'Manual Entry',
      createdAt: now,
    };
    this.state.sources.push(sourceRecord);

    const memory: SecondBrainMemory = {
      id: crypto.randomUUID(),
      userId,
      content,
      contentHash,
      category: data.category || 'fact',
      importance: Math.min(5, Math.max(1, data.importance || 3)),
      projectId: resolvedProjectId,
      sourceId: sourceRecord.id,
      sourceType: sourceRecord.type,
      supersededById: null,
      isActive: true,
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };

    this.state.memories.unshift(memory);
    this.logAudit(userId, clientType, 'memory.save', 'memory', memory.id, {
      category: memory.category,
      preview: content.slice(0, 80),
    });
    this.saveState();

    return { memory, isDuplicate: false };
  }

  public correctMemory(
    userId: string,
    clientType: string,
    memoryId: string,
    updatedContent: string,
    reason: string
  ): { previous: SecondBrainMemory; updated: SecondBrainMemory } {
    const original = this.state.memories.find(
      (m) => m.id === memoryId && m.userId === userId
    );

    if (!original) {
      throw new Error(`Memory with ID ${memoryId} not found.`);
    }

    const now = new Date().toISOString();
    const newContent = updatedContent.trim();
    const contentHash = sha256(newContent.toLowerCase().replace(/\s+/g, ' '));

    const newMemory: SecondBrainMemory = {
      id: crypto.randomUUID(),
      userId,
      content: newContent,
      contentHash,
      category: original.category,
      importance: original.importance,
      projectId: original.projectId,
      sourceId: original.sourceId,
      sourceType: original.sourceType,
      supersededById: null,
      isActive: true,
      metadata: {
        supersededFrom: original.id,
        correctionReason: reason || 'Information update',
      },
      createdAt: now,
      updatedAt: now,
    };

    // Mark original as superseded
    original.isActive = false;
    original.supersededById = newMemory.id;
    original.updatedAt = now;

    this.state.memories.unshift(newMemory);
    this.logAudit(userId, clientType, 'memory.correct', 'memory', newMemory.id, {
      previousId: original.id,
      reason,
    });
    this.saveState();

    return { previous: original, updated: newMemory };
  }

  public searchMemory(
    userId: string,
    query: string,
    options?: { category?: string; projectId?: string; limit?: number }
  ): SecondBrainMemory[] {
    const q = (query || '').toLowerCase().trim();
    const tokens = q.split(/\s+/).filter(Boolean);
    const limit = options?.limit || 10;

    let candidates = this.state.memories.filter((m) => m.userId === userId && m.isActive);

    if (options?.category && options.category !== 'all') {
      candidates = candidates.filter((m) => m.category === options.category);
    }

    if (options?.projectId) {
      candidates = candidates.filter((m) => m.projectId === options.projectId);
    }

    if (!q) {
      return candidates
        .sort((a, b) => b.importance - a.importance || b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit);
    }

    // Reciprocal Rank Fusion (RRF) Ranking
    // 1. Keyword search rank (only for items with matches)
    const keywordMatches = candidates
      .map((m) => {
        const lower = m.content.toLowerCase();
        let matchCount = 0;
        let phraseBonus = lower.includes(q) ? 10 : 0;
        for (const token of tokens) {
          if (lower.includes(token)) matchCount += 1;
        }
        return { item: m, score: matchCount * 3 + phraseBonus };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score);

    // 2. Semantic n-gram token overlap rank (only for items with matches)
    const semanticMatches = candidates
      .map((m) => {
        const lower = m.content.toLowerCase();
        let charMatch = 0;
        for (let i = 0; i < q.length - 2; i++) {
          const trigram = q.slice(i, i + 3);
          if (lower.includes(trigram)) charMatch += 1;
        }
        return { item: m, score: charMatch };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score);

    // Build RRF score maps (k = 60)
    const k = 60;
    const rrfScores = new Map<string, number>();

    keywordMatches.forEach((entry, rank) => {
      const current = rrfScores.get(entry.item.id) || 0;
      rrfScores.set(entry.item.id, current + 2.0 / (k + rank + 1));
    });

    semanticMatches.forEach((entry, rank) => {
      const current = rrfScores.get(entry.item.id) || 0;
      rrfScores.set(entry.item.id, current + 1.0 / (k + rank + 1));
    });

    // Add slight importance weighting to matching items
    candidates.forEach((m) => {
      const base = rrfScores.get(m.id);
      if (base !== undefined && base > 0) {
        rrfScores.set(m.id, base + m.importance * 0.002);
      }
    });

    return candidates
      .filter((m) => (rrfScores.get(m.id) || 0) > 0)
      .sort((a, b) => (rrfScores.get(b.id) || 0) - (rrfScores.get(a.id) || 0))
      .slice(0, limit);
  }

  public listMemories(
    userId: string,
    options?: { category?: string; includeSuperseded?: boolean }
  ): SecondBrainMemory[] {
    let list = this.state.memories.filter((m) => m.userId === userId);
    if (!options?.includeSuperseded) {
      list = list.filter((m) => m.isActive);
    }
    if (options?.category && options.category !== 'all') {
      list = list.filter((m) => m.category === options.category);
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  // ============================================================================
  // TASK MANAGEMENT (INTEGRATED WITH FOCUS DESK)
  // ============================================================================
  public async createTask(
    userId: string,
    clientType: string,
    data: {
      title: string;
      description?: string;
      priority?: TaskPriority;
      dueDate?: string;
      projectName?: string;
      projectId?: string;
      source?: string;
    }
  ): Promise<SecondBrainTask> {
    const title = data.title.trim();
    if (!title) {
      throw new Error('Task title cannot be empty.');
    }

    const now = new Date().toISOString();
    const dueDate = data.dueDate || getTodayString();
    const priority = data.priority || 'medium';

    let resolvedProjectId = data.projectId || null;
    if (!resolvedProjectId && data.projectName) {
      const proj = this.getOrCreateProject(userId, data.projectName);
      resolvedProjectId = proj.id;
    }

    const task: SecondBrainTask = {
      id: crypto.randomUUID(),
      userId,
      title,
      description: data.description || null,
      status: 'todo',
      priority,
      dueDate,
      projectId: resolvedProjectId,
      sourceId: null,
      completedAt: null,
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };

    this.state.tasks.unshift(task);
    this.logAudit(userId, clientType, 'task.create', 'task', task.id, {
      title,
      priority,
      dueDate,
    });
    this.saveState();

    // Mirror sync into main Focus Desk `tasks` table if Supabase is active
    if (supabase) {
      try {
        await supabase.from('tasks').insert({
          id: task.id,
          user_id: userId,
          title: task.title,
          completed: false,
          importance: this.mapPriorityToImportance(priority),
          badge: data.projectName || 'AI Second Brain',
          due_date: dueDate,
          created_at: now,
        });
      } catch (err) {
        console.warn('[SecondBrainService] Mirror sync to tasks table skipped:', err);
      }
    }

    return task;
  }

  public async updateTask(
    userId: string,
    clientType: string,
    taskId: string,
    updates: {
      status?: TaskStatus;
      title?: string;
      priority?: TaskPriority;
      dueDate?: string;
    }
  ): Promise<SecondBrainTask> {
    const task = this.state.tasks.find((t) => t.id === taskId && t.userId === userId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found.`);
    }

    const now = new Date().toISOString();
    if (updates.title !== undefined) task.title = updates.title.trim();
    if (updates.priority !== undefined) task.priority = updates.priority;
    if (updates.dueDate !== undefined) task.dueDate = updates.dueDate;
    if (updates.status !== undefined) {
      task.status = updates.status;
      if (updates.status === 'completed') {
        task.completedAt = now;
      } else {
        task.completedAt = null;
      }
    }
    task.updatedAt = now;

    this.logAudit(userId, clientType, 'task.update', 'task', taskId, updates);
    this.saveState();

    // Sync to main Supabase tasks table
    if (supabase) {
      try {
        await supabase
          .from('tasks')
          .update({
            title: task.title,
            completed: task.status === 'completed',
            importance: this.mapPriorityToImportance(task.priority),
            due_date: task.dueDate,
          })
          .eq('id', taskId);
      } catch (err) {
        console.warn('[SecondBrainService] Supabase task update mirror skipped:', err);
      }
    }

    return task;
  }

  public listTasks(
    userId: string,
    filter?: {
      status?: TaskStatus | 'all';
      priority?: TaskPriority;
      dueDate?: string;
      projectId?: string;
      limit?: number;
    }
  ): SecondBrainTask[] {
    let list = this.state.tasks.filter((t) => t.userId === userId);

    if (filter?.status && filter.status !== 'all') {
      list = list.filter((t) => t.status === filter.status);
    }
    if (filter?.priority) {
      list = list.filter((t) => t.priority === filter.priority);
    }
    if (filter?.dueDate) {
      list = list.filter((t) => t.dueDate === filter.dueDate);
    }
    if (filter?.projectId) {
      list = list.filter((t) => t.projectId === filter.projectId);
    }

    const limit = filter?.limit || 50;
    return list.slice(0, limit);
  }

  private mapPriorityToImportance(p: TaskPriority): 'Urgent' | 'High' | 'Medium' | 'Low' {
    switch (p) {
      case 'urgent':
        return 'Urgent';
      case 'high':
        return 'High';
      case 'low':
        return 'Low';
      default:
        return 'Medium';
    }
  }

  // ============================================================================
  // DECISION LOG
  // ============================================================================
  public recordDecision(
    userId: string,
    clientType: string,
    data: {
      title: string;
      rationale: string;
      implications?: string;
      projectName?: string;
      projectId?: string;
      supersedesDecisionId?: string;
    }
  ): SecondBrainDecision {
    const title = data.title.trim();
    const rationale = data.rationale.trim();
    if (!title || !rationale) {
      throw new Error('Decision title and rationale are required.');
    }

    const now = new Date().toISOString();
    let resolvedProjectId = data.projectId || null;
    if (!resolvedProjectId && data.projectName) {
      const proj = this.getOrCreateProject(userId, data.projectName);
      resolvedProjectId = proj.id;
    }

    const decision: SecondBrainDecision = {
      id: crypto.randomUUID(),
      userId,
      title,
      rationale,
      implications: data.implications || null,
      status: 'active',
      projectId: resolvedProjectId,
      supersededById: null,
      createdAt: now,
      updatedAt: now,
    };

    if (data.supersedesDecisionId) {
      const prior = this.state.decisions.find(
        (d) => d.id === data.supersedesDecisionId && d.userId === userId
      );
      if (prior) {
        prior.status = 'superseded';
        prior.supersededById = decision.id;
        prior.updatedAt = now;
      }
    }

    this.state.decisions.unshift(decision);
    this.logAudit(userId, clientType, 'decision.record', 'decision', decision.id, {
      title,
      supersededId: data.supersedesDecisionId,
    });
    this.saveState();

    return decision;
  }

  public listDecisions(userId: string, projectId?: string): SecondBrainDecision[] {
    let list = this.state.decisions.filter((d) => d.userId === userId);
    if (projectId) {
      list = list.filter((d) => d.projectId === projectId);
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  // ============================================================================
  // PROJECTS & WORKSPACES
  // ============================================================================
  public getOrCreateProject(userId: string, name: string): SecondBrainProject {
    const trimmed = name.trim();
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const existing = this.state.projects.find(
      (p) => p.userId === userId && (p.slug === slug || p.name.toLowerCase() === trimmed.toLowerCase())
    );
    if (existing) return existing;

    const now = new Date().toISOString();
    const newProj: SecondBrainProject = {
      id: crypto.randomUUID(),
      userId,
      name: trimmed,
      slug,
      description: null,
      status: 'active',
      color: '#007AFF',
      createdAt: now,
      updatedAt: now,
    };
    this.state.projects.push(newProj);
    this.saveState();
    return newProj;
  }

  public listProjects(userId: string): SecondBrainProject[] {
    return this.state.projects.filter((p) => p.userId === userId);
  }

  public getProjectStatus(
    userId: string,
    projectIdentifier: string
  ): {
    project: SecondBrainProject;
    openTasks: SecondBrainTask[];
    completedTasks: SecondBrainTask[];
    recentDecisions: SecondBrainDecision[];
    contextMemories: SecondBrainMemory[];
  } {
    const target = projectIdentifier.toLowerCase().trim();
    const proj = this.state.projects.find(
      (p) =>
        p.userId === userId &&
        (p.id === projectIdentifier ||
          p.slug === target ||
          p.name.toLowerCase() === target)
    );

    if (!proj) {
      throw new Error(`Project "${projectIdentifier}" not found.`);
    }

    const tasks = this.state.tasks.filter(
      (t) => t.userId === userId && t.projectId === proj.id
    );
    const openTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');
    const completedTasks = tasks.filter((t) => t.status === 'completed');

    const recentDecisions = this.state.decisions
      .filter((d) => d.userId === userId && d.projectId === proj.id)
      .slice(0, 5);

    const contextMemories = this.state.memories
      .filter((m) => m.userId === userId && m.projectId === proj.id && m.isActive)
      .slice(0, 5);

    return {
      project: proj,
      openTasks,
      completedTasks,
      recentDecisions,
      contextMemories,
    };
  }

  // ============================================================================
  // DETERMINISTIC DAILY BRIEFING
  // ============================================================================
  public getDailyBrief(userId: string, dateStr?: string): DailyBriefingData {
    const today = dateStr || getTodayString();
    const todayTimestamp = new Date(today).getTime();

    // 1. All tasks for this user
    const userTasks = this.state.tasks.filter((t) => t.userId === userId);

    // Overdue tasks: dueDate < today and not completed
    const overdueTasks = userTasks
      .filter((t) => t.status !== 'completed' && t.status !== 'cancelled' && t.dueDate < today)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        dueDate: t.dueDate,
      }));

    // Top 3 Priorities for today
    const priorityWeights: Record<TaskPriority, number> = {
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    const eligibleForPriorities = userTasks
      .filter(
        (t) =>
          t.status !== 'completed' &&
          t.status !== 'cancelled' &&
          (t.dueDate <= today || overdueTasks.some((o) => o.id === t.id))
      )
      .sort((a, b) => {
        const weightDiff = priorityWeights[b.priority] - priorityWeights[a.priority];
        if (weightDiff !== 0) return weightDiff;
        return a.dueDate.localeCompare(b.dueDate);
      });

    const topPriorities = eligibleForPriorities.slice(0, 3).map((t) => {
      const proj = t.projectId
        ? this.state.projects.find((p) => p.id === t.projectId)?.name
        : undefined;
      return {
        id: t.id,
        title: t.title,
        priority: t.priority,
        dueDate: t.dueDate,
        status: t.status,
        projectName: proj,
      };
    });

    // Upcoming 7-day deadlines
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const upcomingDeadlines = userTasks
      .filter((t) => {
        if (t.status === 'completed' || t.status === 'cancelled') return false;
        const taskTime = new Date(t.dueDate).getTime();
        return taskTime >= todayTimestamp && taskTime <= todayTimestamp + sevenDaysMs;
      })
      .map((t) => {
        const daysRemaining = Math.max(
          0,
          Math.ceil((new Date(t.dueDate).getTime() - todayTimestamp) / (24 * 60 * 60 * 1000))
        );
        return {
          id: t.id,
          title: t.title,
          priority: t.priority,
          dueDate: t.dueDate,
          daysRemaining,
        };
      })
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 5);

    // Recent Decisions (last 7 days)
    const recentDecisions = this.state.decisions
      .filter((d) => d.userId === userId && d.status === 'active')
      .slice(0, 4)
      .map((d) => ({
        id: d.id,
        title: d.title,
        rationale: d.rationale,
        createdAt: d.createdAt,
      }));

    // Active Context Notes / Preferences
    const activeContextNotes = this.state.memories
      .filter((m) => m.userId === userId && m.isActive && (m.category === 'preference' || m.category === 'fact'))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 3)
      .map((m) => ({
        id: m.id,
        content: m.content,
        category: m.category,
      }));

    // Compose rich human-readable markdown summary
    const summaryLines: string[] = [
      `### Daily Execution Briefing (${today})`,
      '',
      `**Top Priorities for Today:**`,
    ];

    if (topPriorities.length === 0) {
      summaryLines.push(`- No urgent tasks scheduled. Focus on deep work or planning.`);
    } else {
      topPriorities.forEach((t, i) => {
        summaryLines.push(
          `${i + 1}. **[${t.priority.toUpperCase()}]** ${t.title} ${t.projectName ? `_(${t.projectName})_` : ''}`
        );
      });
    }

    if (overdueTasks.length > 0) {
      summaryLines.push('');
      summaryLines.push(`**⚠️ Overdue Alerts (${overdueTasks.length}):**`);
      overdueTasks.slice(0, 3).forEach((o) => {
        summaryLines.push(`- ${o.title} (due ${o.dueDate})`);
      });
    }

    if (upcomingDeadlines.length > 0) {
      summaryLines.push('');
      summaryLines.push(`**Upcoming 7-Day Deadlines:**`);
      upcomingDeadlines.forEach((u) => {
        summaryLines.push(`- ${u.title} (in ${u.daysRemaining} days — ${u.dueDate})`);
      });
    }

    if (recentDecisions.length > 0) {
      summaryLines.push('');
      summaryLines.push(`**Recent Architectural & Strategy Decisions:**`);
      recentDecisions.forEach((d) => {
        summaryLines.push(`- **${d.title}**: ${d.rationale}`);
      });
    }

    return {
      date: today,
      topPriorities,
      overdueTasks,
      upcomingDeadlines,
      recentDecisions,
      activeContextNotes,
      summaryText: summaryLines.join('\n'),
    };
  }

  // ============================================================================
  // GET CONTEXT (COMPACT BRIEFING FOR PROMPT INJECTION)
  // ============================================================================
  public getContext(
    userId: string,
    options?: { projectId?: string; focusBlock?: string; limit?: number }
  ): {
    contextSummary: string;
    activeMemories: SecondBrainMemory[];
    openTasks: SecondBrainTask[];
    recentDecisions: SecondBrainDecision[];
  } {
    const limit = options?.limit || 5;
    let memories = this.state.memories.filter((m) => m.userId === userId && m.isActive);
    let tasks = this.state.tasks.filter(
      (t) => t.userId === userId && t.status !== 'completed' && t.status !== 'cancelled'
    );
    let decisions = this.state.decisions.filter(
      (d) => d.userId === userId && d.status === 'active'
    );

    if (options?.projectId) {
      memories = memories.filter((m) => m.projectId === options.projectId);
      tasks = tasks.filter((t) => t.projectId === options.projectId);
      decisions = decisions.filter((d) => d.projectId === options.projectId);
    }

    memories = memories
      .sort((a, b) => b.importance - a.importance || b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
    tasks = tasks.slice(0, limit);
    decisions = decisions.slice(0, 3);

    const parts: string[] = ['[Focus Desk Second Brain Context]'];
    if (options?.focusBlock) parts.push(`Active Focus Block: ${options.focusBlock}`);
    if (memories.length > 0) {
      parts.push('Memories & Guidelines:');
      memories.forEach((m) => parts.push(`- [${m.category}] ${m.content}`));
    }
    if (tasks.length > 0) {
      parts.push('Open Tasks:');
      tasks.forEach((t) => parts.push(`- [${t.priority}] ${t.title} (due ${t.dueDate})`));
    }
    if (decisions.length > 0) {
      parts.push('Active Decisions:');
      decisions.forEach((d) => parts.push(`- ${d.title}: ${d.rationale}`));
    }

    return {
      contextSummary: parts.join('\n'),
      activeMemories: memories,
      openTasks: tasks,
      recentDecisions: decisions,
    };
  }

  // ============================================================================
  // CONVERSATION IMPORT & EXTRACTION PIPELINE
  // ============================================================================
  public parseConversationCandidates(content: string, fileName?: string): ExtractedCandidate[] {
    const lines = content.split('\n');
    const candidates: ExtractedCandidate[] = [];

    // Heuristics for tasks, decisions, facts, and lessons
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // 1. Task check: - [ ] Task title or "TODO: ..."
      const taskCheck = line.match(/^[-*]\s*\[\s*\]\s*(.+)/i) || line.match(/^(?:TODO|Action item|Task):\s*(.+)/i);
      if (taskCheck) {
        candidates.push({
          id: 'c_' + crypto.randomUUID().slice(0, 8),
          type: 'task',
          title: taskCheck[1].trim(),
          content: taskCheck[1].trim(),
          priority: 'medium',
          dueDate: getTodayString(),
          confidence: 0.92,
          approved: true,
        });
        continue;
      }

      // 2. Decision check
      const decisionCheck = line.match(/^(?:Decision|Decided(?:\s+to)?|We decided to):\s*(.+)/i);
      if (decisionCheck) {
        candidates.push({
          id: 'c_' + crypto.randomUUID().slice(0, 8),
          type: 'decision',
          title: decisionCheck[1].slice(0, 60),
          content: decisionCheck[1],
          rationale: lines[i + 1]?.trim().startsWith('Because')
            ? lines[i + 1].trim()
            : 'Extracted from conversation import',
          confidence: 0.88,
          approved: true,
        });
        continue;
      }

      // 3. Preference check
      const prefCheck = line.match(/^(?:Preference|Rule|Guideline|User prefers):\s*(.+)/i);
      if (prefCheck) {
        candidates.push({
          id: 'c_' + crypto.randomUUID().slice(0, 8),
          type: 'memory',
          category: 'preference',
          content: prefCheck[1],
          confidence: 0.85,
          approved: true,
        });
        continue;
      }

      // 4. Lesson / Key Fact bullet point
      const lessonCheck = line.match(/^(?:Key takeaway|Lesson learned|Note):\s*(.+)/i);
      if (lessonCheck) {
        candidates.push({
          id: 'c_' + crypto.randomUUID().slice(0, 8),
          type: 'memory',
          category: 'lesson',
          content: lessonCheck[1],
          confidence: 0.82,
          approved: true,
        });
        continue;
      }
    }

    // If no explicit tags, extract key bullet points
    if (candidates.length === 0) {
      const bullets = lines.filter((l) => l.trim().startsWith('- ') || l.trim().startsWith('* '));
      bullets.slice(0, 5).forEach((b) => {
        const text = b.replace(/^[-*]\s*/, '').trim();
        if (text.length > 15) {
          candidates.push({
            id: 'c_' + crypto.randomUUID().slice(0, 8),
            type: 'memory',
            category: 'note',
            content: text,
            confidence: 0.75,
            approved: true,
          });
        }
      });
    }

    return candidates;
  }

  public async approveExtractedCandidates(
    userId: string,
    fileName: string,
    candidates: ExtractedCandidate[]
  ): Promise<{ savedMemories: number; savedTasks: number; savedDecisions: number }> {
    let savedMemories = 0;
    let savedTasks = 0;
    let savedDecisions = 0;

    for (const c of candidates) {
      if (!c.approved) continue;

      if (c.type === 'memory') {
        this.saveMemory(userId, 'import:conversation', {
          content: c.content,
          category: c.category || 'note',
          importance: 3,
          source: 'import',
          externalId: fileName,
        });
        savedMemories++;
      } else if (c.type === 'task') {
        await this.createTask(userId, 'import:conversation', {
          title: c.title || c.content,
          priority: c.priority || 'medium',
          dueDate: c.dueDate || getTodayString(),
          source: 'import',
        });
        savedTasks++;
      } else if (c.type === 'decision') {
        this.recordDecision(userId, 'import:conversation', {
          title: c.title || c.content.slice(0, 60),
          rationale: c.rationale || c.content,
        });
        savedDecisions++;
      }
    }

    this.logAudit(userId, 'import:conversation', 'import.approved', 'import', null, {
      fileName,
      savedMemories,
      savedTasks,
      savedDecisions,
    });

    return { savedMemories, savedTasks, savedDecisions };
  }

  // ============================================================================
  // AUDIT LOGS QUERY
  // ============================================================================
  public getAuditLogs(userId: string, limit = 50): SecondBrainAuditLog[] {
    return this.state.auditLogs
      .filter((a) => a.userId === userId)
      .slice(0, limit);
  }
}

// Global Singleton
export const secondBrainService = new SecondBrainService();
