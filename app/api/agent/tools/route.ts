import { NextResponse } from 'next/server';
import { FIXATES_TOOL_REGISTRY } from '@/lib/harness/toolRegistry';

export async function GET() {
  const openAiTools = FIXATES_TOOL_REGISTRY.map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
    category: t.category,
    voiceExamples: t.voiceTriggers.map((v) => v.example),
  }));

  const mcpTools = FIXATES_TOOL_REGISTRY.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.parameters,
    category: t.category,
  }));

  return NextResponse.json({
    name: 'Fixates AI Agent Harness',
    version: '1.0.0',
    description: 'Autonomous agent and voice command action harness for Fixates macOS Productivity Suite',
    totalTools: FIXATES_TOOL_REGISTRY.length,
    tools: openAiTools,
    mcpFormat: mcpTools,
  });
}
