import { FOCUSDECK_TOOL_REGISTRY } from './toolRegistry';
import { VoiceParseResult } from '@/types/harness';

/**
 * Natural language voice and text command parser.
 * Matches spoken phrases against tool triggers and extracts relevant parameters.
 */
export function parseVoiceCommand(transcript: string): VoiceParseResult {
  const trimmed = transcript.trim();
  if (!trimmed) {
    return {
      matched: false,
      confidence: 0,
      rawTranscript: transcript,
    };
  }

  // 1. Try exact or regex pattern match against tool voice triggers
  for (const tool of FOCUSDECK_TOOL_REGISTRY) {
    for (const trigger of tool.voiceTriggers) {
      if (trigger.pattern instanceof RegExp) {
        const match = trimmed.match(trigger.pattern);
        if (match) {
          const params = trigger.extractParams ? trigger.extractParams(match) : {};
          return {
            matched: true,
            toolName: tool.name,
            parameters: params,
            confidence: 0.95,
            rawTranscript: transcript,
          };
        }
      } else if (typeof trigger.pattern === 'string') {
        if (trimmed.toLowerCase().includes(trigger.pattern.toLowerCase())) {
          const params = trigger.extractParams ? trigger.extractParams(trimmed) : {};
          return {
            matched: true,
            toolName: tool.name,
            parameters: params,
            confidence: 0.85,
            rawTranscript: transcript,
          };
        }
      }
    }
  }

  // 2. Intelligent semantic fallback heuristic
  const lower = trimmed.toLowerCase();

  // Timer heuristics
  if (lower.includes('timer') || lower.includes('pomodoro') || lower.includes('focus')) {
    if (lower.includes('pause') || lower.includes('stop')) {
      return {
        matched: true,
        toolName: 'timer_pause',
        parameters: {},
        confidence: 0.8,
        rawTranscript: transcript,
      };
    }
    if (lower.includes('resume') || lower.includes('continue') || lower.includes('unpause')) {
      return {
        matched: true,
        toolName: 'timer_resume',
        parameters: {},
        confidence: 0.8,
        rawTranscript: transcript,
      };
    }
    if (lower.includes('reset') || lower.includes('restart')) {
      return {
        matched: true,
        toolName: 'timer_reset',
        parameters: {},
        confidence: 0.8,
        rawTranscript: transcript,
      };
    }
    // Check for minutes
    const minMatch = lower.match(/(\d+)\s*(?:minutes?|mins?|m)/);
    const duration = minMatch ? parseInt(minMatch[1], 10) : 25;
    return {
      matched: true,
      toolName: 'timer_start',
      parameters: { durationMinutes: duration, mode: minMatch ? 'custom' : 'pomodoro' },
      confidence: 0.75,
      rawTranscript: transcript,
    };
  }

  // View mode heuristics
  if (lower.includes('feed') && (lower.includes('view') || lower.includes('mode') || lower.includes('switch'))) {
    return {
      matched: true,
      toolName: 'ui_set_view_mode',
      parameters: { mode: 'feed' },
      confidence: 0.85,
      rawTranscript: transcript,
    };
  }
  if (lower.includes('canvas') && (lower.includes('view') || lower.includes('mode') || lower.includes('switch'))) {
    return {
      matched: true,
      toolName: 'ui_set_view_mode',
      parameters: { mode: 'canvas' },
      confidence: 0.85,
      rawTranscript: transcript,
    };
  }

  // Task heuristics
  if (lower.startsWith('add task') || lower.startsWith('create task') || lower.startsWith('new task') || lower.startsWith('todo')) {
    const title = trimmed.replace(/^(add task|create task|new task|todo):?/i, '').trim();
    return {
      matched: true,
      toolName: 'tasks_create',
      parameters: { title: title || 'New Task', importance: 'Medium' },
      confidence: 0.8,
      rawTranscript: transcript,
    };
  }

  // Next meeting heuristic
  if (lower.includes('next meeting') || lower.includes('next event') || lower.includes('upcoming meeting')) {
    return {
      matched: true,
      toolName: 'calendar_get_next_event',
      parameters: {},
      confidence: 0.85,
      rawTranscript: transcript,
    };
  }

  return {
    matched: false,
    confidence: 0,
    rawTranscript: transcript,
    clarificationPrompt: `Could not determine command from "${transcript}". Try saying "start a 30 minute focus timer", "add task review architecture", or "switch to feed view".`,
  };
}
