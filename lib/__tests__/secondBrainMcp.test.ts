import { describe, it, expect, beforeEach } from 'vitest';
import { secondBrainService } from '../second-brain/service';
import { handleMcpStreamableRequest } from '../second-brain/mcp-server';

describe('AI Second Brain & Universal MCP Memory Layer', () => {
  const testUserId = 'test_user_unit';

  beforeEach(() => {
    // Reset or ensure state is loaded
  });

  describe('1. API Token Management & Security Isolation', () => {
    it('generates high-entropy sb_live_ tokens and validates SHA-256 hashes', () => {
      const { rawToken, token } = secondBrainService.generateApiToken(
        testUserId,
        'Cursor macOS Client'
      );

      expect(rawToken).toMatch(/^sb_live_[a-zA-Z0-9_-]+/);
      expect(token.name).toBe('Cursor macOS Client');
      expect(token.tokenHint).toContain('sb_live_...');

      // Validate token
      const validation = secondBrainService.validateToken(rawToken);
      expect(validation).not.toBeNull();
      expect(validation?.valid).toBe(true);
      expect(validation?.userId).toBe(testUserId);
      expect(validation?.tokenName).toBe('Cursor macOS Client');

      // Invalid tokens fail
      expect(secondBrainService.validateToken('invalid_token')).toBeNull();
      expect(secondBrainService.validateToken('sb_live_nonexistent')).toBeNull();

      // Revoke token
      const revoked = secondBrainService.revokeApiToken(testUserId, token.id);
      expect(revoked).toBe(true);

      // Now token validation should fail
      const validationAfterRevoke = secondBrainService.validateToken(rawToken);
      expect(validationAfterRevoke).toBeNull();
    });
  });

  describe('2. Memory Engine & Deduplication', () => {
    it('saves memories and deduplicates identical content via SHA-256', () => {
      const runUser = `test_user_mem_${Date.now()}`;
      const content = `TypeScript strict mode must always be enabled in production ${Date.now()}.`;
      const res1 = secondBrainService.saveMemory(runUser, 'test', {
        content,
        category: 'rule' as any,
        importance: 4,
      });

      expect(res1.memory.id).toBeDefined();
      expect(res1.memory.content).toBe(content);
      expect(res1.isDuplicate).toBe(false);

      // Save duplicate with same content
      const res2 = secondBrainService.saveMemory(runUser, 'test', {
        content: `  ${content}  `,
        importance: 5,
      });

      expect(res2.isDuplicate).toBe(true);
      expect(res2.memory.id).toBe(res1.memory.id);
      expect(res2.memory.importance).toBe(5); // Upgraded importance
    });

    it('corrects memory while preserving historical provenance', () => {
      const original = secondBrainService.saveMemory(testUserId, 'test', {
        content: 'The meeting takes place on Tuesday at 3 PM.',
        category: 'fact',
      });

      const correction = secondBrainService.correctMemory(
        testUserId,
        'test',
        original.memory.id,
        'The meeting has been rescheduled to Thursday at 4 PM.',
        'Rescheduled by team lead'
      );

      expect(correction.previous.isActive).toBe(false);
      expect(correction.previous.supersededById).toBe(correction.updated.id);
      expect(correction.updated.isActive).toBe(true);
      expect(correction.updated.content).toBe('The meeting has been rescheduled to Thursday at 4 PM.');
      expect(correction.updated.metadata?.supersededFrom).toBe(original.memory.id);
    });

    it('performs hybrid search with RRF scoring', () => {
      secondBrainService.saveMemory(testUserId, 'test', {
        content: 'PostgreSQL pgvector extension enables cosine similarity search.',
        category: 'fact',
        importance: 4,
      });

      secondBrainService.saveMemory(testUserId, 'test', {
        content: 'Drizzle ORM supports PostgreSQL schema definitions with pgSchema.',
        category: 'fact',
        importance: 3,
      });

      const searchResults = secondBrainService.searchMemory(testUserId, 'pgvector similarity');
      expect(searchResults.length).toBeGreaterThanOrEqual(1);
      expect(searchResults[0].content).toContain('pgvector');
    });
  });

  describe('3. Tasks Integration & Mirroring', () => {
    it('creates, lists, and updates tasks with priority and due date', async () => {
      const task = await secondBrainService.createTask(testUserId, 'test', {
        title: 'Complete MCP integration testing',
        priority: 'urgent',
        dueDate: '2026-10-25',
      });

      expect(task.id).toBeDefined();
      expect(task.title).toBe('Complete MCP integration testing');
      expect(task.status).toBe('todo');

      const list = secondBrainService.listTasks(testUserId, { status: 'todo' });
      expect(list.some((t) => t.id === task.id)).toBe(true);

      const updated = await secondBrainService.updateTask(testUserId, 'test', task.id, {
        status: 'completed',
      });
      expect(updated.status).toBe('completed');
      expect(updated.completedAt).toBeDefined();
    });
  });

  describe('4. Deterministic Daily Briefing', () => {
    it('synthesizes top priorities and overdue tasks without requiring an LLM', async () => {
      await secondBrainService.createTask(testUserId, 'test', {
        title: 'Review production pull requests',
        priority: 'urgent',
        dueDate: '2026-10-25',
      });

      await secondBrainService.createTask(testUserId, 'test', {
        title: 'Old overdue action item',
        priority: 'high',
        dueDate: '2026-10-20', // past date
      });

      const brief = secondBrainService.getDailyBrief(testUserId, '2026-10-25');
      expect(brief.date).toBe('2026-10-25');
      expect(brief.topPriorities.length).toBeGreaterThanOrEqual(1);
      expect(brief.overdueTasks.length).toBeGreaterThanOrEqual(1);
      expect(brief.summaryText).toContain('Daily Execution Briefing');
    });
  });

  describe('5. Remote Streamable HTTP MCP Server (/mcp)', () => {
    it('rejects unauthenticated requests with HTTP 401', async () => {
      const req = new Request('http://localhost:3000/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
        }),
      });

      const res = await handleMcpStreamableRequest(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.code).toBe(-32000);
    });

    it('initializes and lists tools over authenticated Bearer token', async () => {
      const { rawToken } = secondBrainService.generateApiToken(testUserId, 'Claude Desktop');

      // 1. Initialize
      const initReq = new Request('http://localhost:3000/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${rawToken}`,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'claude-desktop', version: '1.0.0' },
          },
        }),
      });

      const initRes = await handleMcpStreamableRequest(initReq);
      expect(initRes.status).toBe(200);
      const initJson = await initRes.json();
      expect(initJson.result.serverInfo.name).toBe('focus-desk-second-brain');

      // 2. Call save_memory tool
      const saveReq = new Request('http://localhost:3000/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${rawToken}`,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: {
            name: 'save_memory',
            arguments: {
              content: `User prefers dark mode macOS interfaces with fast keyboard shortcuts ${Date.now()}.`,
              category: 'preference',
              importance: 5,
            },
          },
        }),
      });

      const saveRes = await handleMcpStreamableRequest(saveReq);
      expect(saveRes.status).toBe(200);
      const saveJson = await saveRes.json();
      expect(saveJson.result.content[0].text).toContain('"success": true');

      // 3. Call get_daily_brief tool
      const briefReq = new Request('http://localhost:3000/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${rawToken}`,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 3,
          method: 'tools/call',
          params: {
            name: 'get_daily_brief',
            arguments: {},
          },
        }),
      });

      const briefRes = await handleMcpStreamableRequest(briefReq);
      expect(briefRes.status).toBe(200);
      const briefJson = await briefRes.json();
      expect(briefJson.result.content[0].text).toContain('Daily Execution Briefing');
    });
  });
});
