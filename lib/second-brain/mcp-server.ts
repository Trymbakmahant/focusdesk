import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';
import { secondBrainService } from './service';

export function createSecondBrainMcpServer(userId: string, clientName = 'AI Client') {
  const server = new McpServer({
    name: 'focus-desk-second-brain',
    version: '1.0.0',
  });

  // 1. search_memory
  server.tool(
    'search_memory',
    'Semantic and keyword hybrid search across user memories, facts, preferences, lessons, and project notes.',
    {
      query: z.string().describe('Search query (keywords, concepts, or natural language question)'),
      category: z
        .enum(['all', 'fact', 'preference', 'lesson', 'note', 'project_context'])
        .optional()
        .describe('Optional category filter'),
      projectId: z.string().optional().describe('Optional project ID filter'),
      limit: z.number().int().min(1).max(30).optional().describe('Maximum number of results to return (default 10)'),
    },
    async ({ query, category, projectId, limit }) => {
      const results = secondBrainService.searchMemory(userId, query, {
        category,
        projectId,
        limit: limit || 10,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                query,
                matchCount: results.length,
                memories: results.map((m) => ({
                  id: m.id,
                  content: m.content,
                  category: m.category,
                  importance: m.importance,
                  source: m.sourceType,
                  createdAt: m.createdAt,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // 2. get_context
  server.tool(
    'get_context',
    'Get a compact, source-grounded briefing of active memories, open tasks, and recent decisions for any project or focus block.',
    {
      projectId: z.string().optional().describe('Optional project ID to scope context'),
      focusBlock: z.string().optional().describe('Optional focus block topic (e.g. "Deep Work Sprint")'),
      limit: z.number().int().min(1).max(20).optional().describe('Maximum items per section'),
    },
    async ({ projectId, focusBlock, limit }) => {
      const context = secondBrainService.getContext(userId, {
        projectId,
        focusBlock,
        limit: limit || 5,
      });

      return {
        content: [
          {
            type: 'text',
            text: context.contextSummary,
          },
        ],
      };
    }
  );

  // 3. save_memory
  server.tool(
    'save_memory',
    'Persists facts, preferences, lessons, and project notes captured during AI discussions into user knowledge base.',
    {
      content: z.string().describe('The knowledge item or preference to remember'),
      category: z
        .enum(['fact', 'preference', 'lesson', 'note', 'project_context'])
        .default('fact')
        .describe('Category of memory'),
      importance: z.number().int().min(1).max(5).default(3).describe('Importance rating from 1 (minor) to 5 (critical)'),
      projectName: z.string().optional().describe('Associated project name or workspace'),
      projectId: z.string().optional().describe('Associated project ID'),
    },
    async ({ content, category, importance, projectName, projectId }) => {
      const { memory, isDuplicate } = secondBrainService.saveMemory(
        userId,
        `mcp:${clientName.toLowerCase()}`,
        {
          content,
          category,
          importance,
          projectName,
          projectId,
          source: clientName,
        }
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                message: isDuplicate
                  ? 'Memory already existed and was updated with fresh timestamp.'
                  : 'Memory saved successfully to Focus Desk Second Brain.',
                memory: {
                  id: memory.id,
                  content: memory.content,
                  category: memory.category,
                  importance: memory.importance,
                  createdAt: memory.createdAt,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // 4. create_task
  server.tool(
    'create_task',
    'Creates a new task in Focus Desk with priority and due date. Immediately visible in the Focus Desk user interface.',
    {
      title: z.string().describe('Task title or action item'),
      description: z.string().optional().describe('Detailed task description or context'),
      priority: z.enum(['urgent', 'high', 'medium', 'low']).default('medium').describe('Task priority level'),
      dueDate: z.string().optional().describe('Due date in YYYY-MM-DD format (defaults to today)'),
      projectName: z.string().optional().describe('Project name or initiative to assign the task to'),
      projectId: z.string().optional().describe('Project ID'),
    },
    async ({ title, description, priority, dueDate, projectName, projectId }) => {
      const task = await secondBrainService.createTask(
        userId,
        `mcp:${clientName.toLowerCase()}`,
        {
          title,
          description,
          priority,
          dueDate,
          projectName,
          projectId,
          source: clientName,
        }
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                message: `Task "${task.title}" created successfully in Focus Desk.`,
                task: {
                  id: task.id,
                  title: task.title,
                  priority: task.priority,
                  dueDate: task.dueDate,
                  status: task.status,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // 5. list_tasks
  server.tool(
    'list_tasks',
    'Inspects tasks inside Focus Desk with status, priority, and due date filters.',
    {
      status: z.enum(['todo', 'in_progress', 'completed', 'all']).default('todo').describe('Task status filter'),
      priority: z.enum(['urgent', 'high', 'medium', 'low']).optional().describe('Priority filter'),
      dueDate: z.string().optional().describe('Specific due date (YYYY-MM-DD)'),
      projectId: z.string().optional().describe('Project ID filter'),
      limit: z.number().int().min(1).max(50).optional().describe('Maximum number of tasks to return'),
    },
    async ({ status, priority, dueDate, projectId, limit }) => {
      const tasks = secondBrainService.listTasks(userId, {
        status,
        priority,
        dueDate,
        projectId,
        limit: limit || 20,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                total: tasks.length,
                tasks: tasks.map((t) => ({
                  id: t.id,
                  title: t.title,
                  status: t.status,
                  priority: t.priority,
                  dueDate: t.dueDate,
                  completedAt: t.completedAt,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // 6. update_task
  server.tool(
    'update_task',
    'Updates task progress or marks a task complete in Focus Desk.',
    {
      taskId: z.string().describe('ID of the task to update'),
      status: z.enum(['todo', 'in_progress', 'completed', 'cancelled']).optional().describe('New status'),
      title: z.string().optional().describe('Updated title'),
      priority: z.enum(['urgent', 'high', 'medium', 'low']).optional().describe('Updated priority'),
      dueDate: z.string().optional().describe('Updated due date (YYYY-MM-DD)'),
    },
    async ({ taskId, status, title, priority, dueDate }) => {
      const updated = await secondBrainService.updateTask(
        userId,
        `mcp:${clientName.toLowerCase()}`,
        taskId,
        { status, title, priority, dueDate }
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                message: `Task "${updated.title}" updated successfully (status: ${updated.status}).`,
                task: updated,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // 7. get_project_status
  server.tool(
    'get_project_status',
    'Summarizes open tasks, blockers, recent decisions, and active notes for a given project or workspace.',
    {
      projectNameOrId: z.string().describe('Project name, slug, or UUID'),
    },
    async ({ projectNameOrId }) => {
      const status = secondBrainService.getProjectStatus(userId, projectNameOrId);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                project: {
                  id: status.project.id,
                  name: status.project.name,
                  status: status.project.status,
                },
                openTaskCount: status.openTasks.length,
                completedTaskCount: status.completedTasks.length,
                openTasks: status.openTasks.map((t) => ({
                  id: t.id,
                  title: t.title,
                  priority: t.priority,
                  dueDate: t.dueDate,
                })),
                recentDecisions: status.recentDecisions.map((d) => ({
                  id: d.id,
                  title: d.title,
                  rationale: d.rationale,
                })),
                activeMemories: status.contextMemories.map((m) => ({
                  id: m.id,
                  content: m.content,
                  category: m.category,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // 8. record_decision
  server.tool(
    'record_decision',
    'Records an architectural, product, or personal decision with rationale, implications, and supersession links.',
    {
      title: z.string().describe('Brief title of the decision'),
      rationale: z.string().describe('Why this decision was made and what alternatives were considered'),
      implications: z.string().optional().describe('Expected trade-offs or consequences'),
      projectName: z.string().optional().describe('Associated project name'),
      projectId: z.string().optional().describe('Associated project ID'),
      supersedesDecisionId: z.string().optional().describe('ID of a previous decision this one replaces'),
    },
    async ({ title, rationale, implications, projectName, projectId, supersedesDecisionId }) => {
      const decision = secondBrainService.recordDecision(
        userId,
        `mcp:${clientName.toLowerCase()}`,
        {
          title,
          rationale,
          implications,
          projectName,
          projectId,
          supersedesDecisionId,
        }
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                message: `Decision "${decision.title}" recorded successfully.`,
                decision: {
                  id: decision.id,
                  title: decision.title,
                  status: decision.status,
                  createdAt: decision.createdAt,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // 9. get_daily_brief
  server.tool(
    'get_daily_brief',
    'Deterministic daily briefing synthesized from live database records: top 3 daily priorities, overdue alerts, 7-day deadlines, and recent decisions.',
    {
      date: z.string().optional().describe('Date in YYYY-MM-DD format (defaults to current date)'),
    },
    async ({ date }) => {
      const brief = secondBrainService.getDailyBrief(userId, date);

      return {
        content: [
          {
            type: 'text',
            text: brief.summaryText,
          },
        ],
      };
    }
  );

  // 10. correct_memory
  server.tool(
    'correct_memory',
    'Corrects outdated information while preserving historical provenance (marks old memory as superseded and links to updated memory).',
    {
      memoryId: z.string().describe('ID of the outdated memory to supersede'),
      updatedContent: z.string().describe('The new, accurate information to replace it with'),
      reason: z.string().describe('Reason for this correction'),
    },
    async ({ memoryId, updatedContent, reason }) => {
      const { previous, updated } = secondBrainService.correctMemory(
        userId,
        `mcp:${clientName.toLowerCase()}`,
        memoryId,
        updatedContent,
        reason
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                message: 'Memory corrected successfully with historical provenance preserved.',
                supersededMemoryId: previous.id,
                newMemory: {
                  id: updated.id,
                  content: updated.content,
                  category: updated.category,
                  createdAt: updated.createdAt,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  return server;
}

export async function handleMcpStreamableRequest(req: Request): Promise<Response> {
  // 1. CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type, Last-Event-ID, mcp-session-id',
      },
    });
  }

  // 2. Multi-Tenant Authentication: Derive user directly from validated Bearer token
  const authHeader = req.headers.get('authorization') || '';
  const tokenMatch = authHeader.match(/^Bearer\s+(sb_live_[a-zA-Z0-9_-]+)/);

  // Allow query param ?token=sb_live_... for SSE clients that don't support custom headers
  let rawToken = tokenMatch ? tokenMatch[1] : '';
  if (!rawToken) {
    const url = new URL(req.url);
    const queryToken = url.searchParams.get('token');
    if (queryToken && queryToken.startsWith('sb_live_')) {
      rawToken = queryToken;
    }
  }

  if (!rawToken) {
    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message:
            'Authentication required. Please provide a valid Bearer token (sb_live_...) generated in Focus Desk settings.',
        },
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  const tokenValidation = secondBrainService.validateToken(rawToken);
  if (!tokenValidation || !tokenValidation.valid) {
    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32001,
          message: 'Invalid or revoked API token. Please verify your token in Focus Desk settings.',
        },
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  const { userId, tokenName } = tokenValidation;

  // 3. Create fresh McpServer instance scoped to this user
  const mcpServer = createSecondBrainMcpServer(userId, tokenName || 'AI Client');

  // 4. Transport handling via WebStandardStreamableHTTPServerTransport in stateless mode
  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
  });

  await mcpServer.connect(transport);

  // Normalize Accept header to ensure both application/json and text/event-stream are present per MCP spec
  const currentAccept = req.headers.get('accept') || '';
  let requestToHandle: Request;
  if (!currentAccept.includes('application/json') || !currentAccept.includes('text/event-stream')) {
    const rawBodyText = req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined;
    const newHeaders = new Headers(req.headers);
    newHeaders.set('accept', 'application/json, text/event-stream');
    requestToHandle = new Request(req.url, {
      method: req.method,
      headers: newHeaders,
      body: rawBodyText,
    });
  } else {
    requestToHandle = req;
  }

  // 5. Handle Request
  const response = await transport.handleRequest(requestToHandle);

  // Add CORS headers to response
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, Last-Event-ID, mcp-session-id');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
