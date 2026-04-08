import { NextRequest, NextResponse } from 'next/server';
import { FIXATES_TOOL_REGISTRY } from '@/lib/harness/toolRegistry';

export async function POST(req: NextRequest) {
  try {
    const { messages = [] } = await req.json();

    const azureKey = process.env.AZURE_AI_KEY || process.env.AZURE_OPENAI_API_KEY;
    const azureEndpoint = process.env.AZURE_AI_ENDPOINT || 'https://smoothy-resource.services.ai.azure.com';
    const azureDeployment = process.env.AZURE_AI_DEPLOYMENT || 'grok-beta';
    const directGrokKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;

    if (!azureKey && !directGrokKey) {
      return NextResponse.json(
        {
          error: 'Missing API credentials. Please set AZURE_AI_KEY or GROK_API_KEY in your .env.local file.',
          reply: 'I cannot connect to the AI model yet. Please add your AZURE_AI_KEY or GROK_API_KEY to frontend/.env.local.',
        },
        { status: 500 }
      );
    }

    // Convert tool registry to standard OpenAI/Azure tool specifications
    const tools = FIXATES_TOOL_REGISTRY.map((t) => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));

    const systemPrompt = `You are Fixates AI, an intelligent, concise voice assistant embedded in the FocusDeck macOS desktop app.
You manage focus sessions, pomodoros, tasks, notes, habits, reminders, and calendar events.

Guidelines:
1. SPHINX CONCISENESS: Your responses will be read aloud by browser Text-To-Speech (TTS). Keep verbal replies short, crisp, and direct (1 to 2 sentences maximum).
2. INTERACTIVE CLARIFICATION: If the user gives an incomplete request (e.g. "remind me to call my mom tonight" or "create a task to review code" without critical details), DO NOT guess blindly. Instead, ask a short, natural clarifying question (e.g. "What time tonight would you like me to set the reminder for?").
3. DIRECT EXECUTION: Once you have the necessary information (or if all information is already provided like "start a 25 min pomodoro" or "remind me to call my mom at 8pm"), execute the corresponding tool immediately.
4. Current Date/Time context: ${new Date().toLocaleString('en-US', { timeZoneName: 'short' })}. Today is ${new Date().toISOString().split('T')[0]}.`;

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-8), // Keep last 8 turns for conversational context
    ];

    let apiUrl = '';
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    let payload: any = {
      messages: formattedMessages,
      tools,
      tool_choice: 'auto',
      temperature: 0.3,
    };

    if (directGrokKey) {
      apiUrl = 'https://api.x.ai/v1/chat/completions';
      headers['Authorization'] = `Bearer ${directGrokKey}`;
      payload.model = process.env.GROK_MODEL || 'grok-beta';
    } else {
      // Azure AI Foundry / Azure Services endpoint
      const cleanBase = azureEndpoint.replace(/\/+$/, '');
      if (cleanBase.includes('services.ai.azure.com')) {
        apiUrl = `${cleanBase}/models/chat/completions?api-version=2024-05-01-preview`;
      } else if (cleanBase.includes('openai.azure.com')) {
        apiUrl = `${cleanBase}/openai/deployments/${azureDeployment}/chat/completions?api-version=2024-08-01-preview`;
      } else {
        apiUrl = `${cleanBase}/chat/completions`;
      }
      headers['api-key'] = azureKey!;
      payload.model = azureDeployment;
    }

    const aiRes = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('AI chat endpoint error:', aiRes.status, errText);
      return NextResponse.json(
        {
          error: `AI API returned status ${aiRes.status}: ${errText}`,
          reply: 'Sorry, I ran into an error communicating with the AI service.',
        },
        { status: aiRes.status }
      );
    }

    const aiData = await aiRes.json();
    const choice = aiData.choices?.[0];
    const message = choice?.message;

    return NextResponse.json({
      success: true,
      reply: message?.content || (message?.tool_calls?.length ? 'Executing command...' : ''),
      tool_calls: message?.tool_calls || [],
    });
  } catch (error: any) {
    console.error('Agent chat route error:', error);
    return NextResponse.json(
      {
        error: error?.message || 'Internal server error',
        reply: 'Sorry, I encountered an internal error processing that request.',
      },
      { status: 500 }
    );
  }
}
