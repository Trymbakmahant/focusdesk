import { NextResponse } from 'next/server';
import { FOCUSDECK_TOOL_REGISTRY } from '@/lib/harness/toolRegistry';

export async function GET() {
  const openAiTools = FOCUSDECK_TOOL_REGISTRY.map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
    category: t.category,
    voiceExamples: t.voiceTriggers.map((v) => v.example),
  }));

  const mcpTools = FOCUSDECK_TOOL_REGISTRY.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.parameters,
    category: t.category,
  }));

  return NextResponse.json({
    name: 'FocusDeck AI Agent Harness',
    version: '1.0.0',
    description: 'Autonomous agent and voice command action harness for FocusDeck macOS Productivity Suite',
    totalTools: FOCUSDECK_TOOL_REGISTRY.length,
    tools: openAiTools,
    mcpFormat: mcpTools,
  });
}
