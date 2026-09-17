export type AgentToolCategory =
  | 'timer'
  | 'focus'
  | 'tasks'
  | 'calendar'
  | 'habits'
  | 'notes'
  | 'reminders'
  | 'ui';

export interface JSONSchemaProperty {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  description: string;
  enum?: (string | number)[];
  default?: string | number | boolean;
  items?: JSONSchemaProperty;
}

export interface JSONSchema {
  type: 'object';
  properties: Record<string, JSONSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface ToolExecutionResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface VoiceTriggerPattern {
  pattern: RegExp | string;
  example: string;
  extractParams?: (matches: RegExpMatchArray | string) => Record<string, unknown>;
}

export interface HarnessToolDefinition {
  name: string;
  category: AgentToolCategory;
  description: string;
  parameters: JSONSchema;
  voiceTriggers: VoiceTriggerPattern[];
  execute: (params: Record<string, any>) => Promise<ToolExecutionResult> | ToolExecutionResult;
}

export interface VoiceParseResult {
  matched: boolean;
  toolName?: string;
  parameters?: Record<string, any>;
  confidence: number;
  rawTranscript: string;
  clarificationPrompt?: string;
}

export interface HarnessExecutionLog {
  id: string;
  toolName: string;
  source: 'voice' | 'agent' | 'manual' | 'api';
  parameters: Record<string, any>;
  result: ToolExecutionResult;
  timestamp: number;
}
