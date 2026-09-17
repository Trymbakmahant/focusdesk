import { NextRequest, NextResponse } from 'next/server';
import { FOCUSDECK_TOOL_REGISTRY } from '@/lib/harness/toolRegistry';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tool: toolName, parameters = {} } = body;

    if (!toolName) {
      return NextResponse.json(
        { error: 'Missing required field "tool"' },
        { status: 400 }
      );
    }

    const tool = FOCUSDECK_TOOL_REGISTRY.find((t) => t.name === toolName);
    if (!tool) {
      return NextResponse.json(
        {
          error: `Tool "${toolName}" not found.`,
          availableTools: FOCUSDECK_TOOL_REGISTRY.map((t) => t.name),
        },
        { status: 404 }
      );
    }

    // Execute tool handler (server-safe execution)
    const result = await tool.execute(parameters);

    return NextResponse.json({
      success: result.success,
      tool: toolName,
      parameters,
      message: result.message,
      data: result.data,
      timestamp: result.timestamp,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to execute tool' },
      { status: 500 }
    );
  }
}
