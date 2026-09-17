import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FOCUSDECK_TOOL_REGISTRY } from '../harness/toolRegistry';
import { parseVoiceCommand } from '../harness/voiceParser';
import { FocusDeckHarness } from '../harness/clientHarness';

describe('FocusDeck AI Agent Harness & Tool Registry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Tool Registry Integrity', () => {
    it('registers all core FocusDeck tools across all 8 functional domains', () => {
      expect(FOCUSDECK_TOOL_REGISTRY.length).toBeGreaterThanOrEqual(14);

      const toolNames = FOCUSDECK_TOOL_REGISTRY.map((t) => t.name);
      // Timer
      expect(toolNames).toContain('timer_start');
      expect(toolNames).toContain('timer_pause');
      expect(toolNames).toContain('timer_resume');
      expect(toolNames).toContain('timer_reset');
      expect(toolNames).toContain('timer_set_target');
      // Focus Intention
      expect(toolNames).toContain('focus_set_intention');
      expect(toolNames).toContain('focus_get_stats');
      // Tasks
      expect(toolNames).toContain('tasks_list');
      expect(toolNames).toContain('tasks_create');
      expect(toolNames).toContain('tasks_toggle');
      // Calendar
      expect(toolNames).toContain('calendar_get_next_event');
      expect(toolNames).toContain('calendar_get_events');
      // Habits
      expect(toolNames).toContain('habits_list');
      expect(toolNames).toContain('habits_increment');
      // Notes
      expect(toolNames).toContain('notes_get');
      expect(toolNames).toContain('notes_append');
      // Reminders
      expect(toolNames).toContain('reminders_create');
      // UI / Navigation
      expect(toolNames).toContain('ui_set_view_mode');
      expect(toolNames).toContain('ui_get_view_mode');
    });

    it('every tool definition conforms to OpenAI / MCP JSON Schema specifications', () => {
      FOCUSDECK_TOOL_REGISTRY.forEach((tool) => {
        expect(tool.name).toMatch(/^[a-z]+_[a-z_]+$/);
        expect(typeof tool.description).toBe('string');
        expect(tool.description.length).toBeGreaterThan(10);
        expect(tool.parameters.type).toBe('object');
        expect(typeof tool.parameters.properties).toBe('object');
        expect(Array.isArray(tool.voiceTriggers)).toBe(true);
        expect(typeof tool.execute).toBe('function');
      });
    });
  });

  describe('Natural Language & Voice Command Parser', () => {
    it('correctly maps timer voice commands with duration parameter extraction', () => {
      const result = parseVoiceCommand('start a focus timer for 45 minutes');
      expect(result.matched).toBe(true);
      expect(result.toolName).toBe('timer_start');
      expect(result.parameters?.durationMinutes).toBe(45);
      expect(result.parameters?.mode).toBe('custom');
    });

    it('correctly maps short break voice command', () => {
      const result = parseVoiceCommand('take a short break');
      expect(result.matched).toBe(true);
      expect(result.toolName).toBe('timer_start');
      expect(result.parameters?.mode).toBe('shortBreak');
    });

    it('correctly maps pause timer voice command', () => {
      const result = parseVoiceCommand('pause the focus timer');
      expect(result.matched).toBe(true);
      expect(result.toolName).toBe('timer_pause');
    });

    it('correctly maps view mode voice commands (canvas & feed)', () => {
      const feedResult = parseVoiceCommand('switch to feed view');
      expect(feedResult.matched).toBe(true);
      expect(feedResult.toolName).toBe('ui_set_view_mode');
      expect(feedResult.parameters?.mode).toBe('feed');

      const canvasResult = parseVoiceCommand('switch to canvas view');
      expect(canvasResult.matched).toBe(true);
      expect(canvasResult.toolName).toBe('ui_set_view_mode');
      expect(canvasResult.parameters?.mode).toBe('canvas');
    });

    it('correctly maps daily focus intention voice command', () => {
      const result = parseVoiceCommand('set my focus today to Ship Rust Tauri IPC');
      expect(result.matched).toBe(true);
      expect(result.toolName).toBe('focus_set_intention');
      expect(result.parameters?.intention).toBe('Ship Rust Tauri IPC');
    });

    it('correctly maps task creation voice command', () => {
      const result = parseVoiceCommand('add task review Supabase RLS security rules');
      expect(result.matched).toBe(true);
      expect(result.toolName).toBe('tasks_create');
      expect(result.parameters?.title).toBe('review Supabase RLS security rules');
    });

    it('correctly maps calendar query voice command', () => {
      const result = parseVoiceCommand("what's my next meeting");
      expect(result.matched).toBe(true);
      expect(result.toolName).toBe('calendar_get_next_event');
    });

    it('handles unrecognized voice commands with informative fallback prompt', () => {
      const result = parseVoiceCommand('play some rock music');
      expect(result.matched).toBe(false);
      expect(result.clarificationPrompt).toContain('Could not determine command');
    });
  });

  describe('Client Harness Execution', () => {
    it('executes tools programmatically and records execution logs', async () => {
      const result = await FocusDeckHarness.executeTool('timer_start', {
        durationMinutes: 30,
        mode: 'custom',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Started custom timer for 30 minutes');

      const logs = FocusDeckHarness.getExecutionLogs();
      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs[0].toolName).toBe('timer_start');
    });

    it('executes natural language voice commands through FocusDeckHarness', async () => {
      const result = await FocusDeckHarness.executeVoiceCommand('switch to feed view');
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ mode: 'feed' });
    });

    it('gracefully handles unknown tool execution without throwing', async () => {
      const result = await FocusDeckHarness.executeTool('non_existent_tool', {});
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });
});
