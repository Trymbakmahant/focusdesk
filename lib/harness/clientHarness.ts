import { FOCUSDECK_TOOL_REGISTRY } from './toolRegistry';
import { parseVoiceCommand } from './voiceParser';
import { HarnessToolDefinition, ToolExecutionResult, HarnessExecutionLog } from '@/types/harness';

declare global {
  interface Window {
    __FOCUSDECK_HARNESS__?: FocusDeckHarnessInstance;
  }
}

class FocusDeckHarnessInstance {
  private logs: HarnessExecutionLog[] = [];
  private listeners: ((log: HarnessExecutionLog) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.__FOCUSDECK_HARNESS__ = this;
    }
  }

  /**
   * List all registered tools in FocusDeck
   */
  public listTools(): HarnessToolDefinition[] {
    return FOCUSDECK_TOOL_REGISTRY;
  }

  /**
   * Get a specific tool definition by name
   */
  public getTool(name: string): HarnessToolDefinition | undefined {
    return FOCUSDECK_TOOL_REGISTRY.find((t) => t.name === name);
  }

  /**
   * Execute any registered tool programmatically by name with parameters
   */
  public async executeTool(
    toolName: string,
    parameters: Record<string, any> = {},
    source: HarnessExecutionLog['source'] = 'agent'
  ): Promise<ToolExecutionResult> {
    const tool = this.getTool(toolName);
    if (!tool) {
      const errResult: ToolExecutionResult = {
        success: false,
        message: `Tool "${toolName}" not found in FocusDeck registry.`,
        error: `Unknown tool name "${toolName}"`,
        timestamp: Date.now(),
      };
      this.recordLog(toolName, source, parameters, errResult);
      return errResult;
    }

    try {
      const result = await tool.execute(parameters);
      this.recordLog(toolName, source, parameters, result);
      return result;
    } catch (err: any) {
      const errResult: ToolExecutionResult = {
        success: false,
        message: `Execution failed for tool "${toolName}": ${err?.message || err}`,
        error: String(err),
        timestamp: Date.now(),
      };
      this.recordLog(toolName, source, parameters, errResult);
      return errResult;
    }
  }

  /**
   * Parse and execute a spoken or typed natural language command
   */
  public async executeVoiceCommand(transcript: string): Promise<ToolExecutionResult> {
    const parsed = parseVoiceCommand(transcript);

    if (!parsed.matched || !parsed.toolName) {
      const failResult: ToolExecutionResult = {
        success: false,
        message: parsed.clarificationPrompt || `Could not match voice command: "${transcript}"`,
        error: 'NO_TOOL_MATCHED',
        timestamp: Date.now(),
      };
      this.recordLog('unknown', 'voice', { rawTranscript: transcript }, failResult);
      return failResult;
    }

    return this.executeTool(parsed.toolName, parsed.parameters || {}, 'voice');
  }

  /**
   * Get recent harness execution logs
   */
  public getExecutionLogs(): HarnessExecutionLog[] {
    return [...this.logs];
  }

  /**
   * Subscribe to live tool executions
   */
  public onExecution(callback: (log: HarnessExecutionLog) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private recordLog(
    toolName: string,
    source: HarnessExecutionLog['source'],
    parameters: Record<string, any>,
    result: ToolExecutionResult
  ) {
    const log: HarnessExecutionLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      toolName,
      source,
      parameters,
      result,
      timestamp: Date.now(),
    };
    this.logs.unshift(log);
    if (this.logs.length > 50) this.logs.pop();
    this.listeners.forEach((l) => l(log));
  }
}

export const FocusDeckHarness = new FocusDeckHarnessInstance();
