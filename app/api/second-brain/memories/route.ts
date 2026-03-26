import { NextRequest, NextResponse } from 'next/server';
import { secondBrainService } from '@/lib/second-brain/service';
import { getUserIdFromRequest } from '@/lib/second-brain/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const category = searchParams.get('category') || undefined;
    const includeSuperseded = searchParams.get('includeSuperseded') === 'true';

    let memories;
    if (query && query.trim()) {
      memories = secondBrainService.searchMemory(userId, query.trim(), {
        category,
      });
    } else {
      memories = secondBrainService.listMemories(userId, {
        category,
        includeSuperseded,
      });
    }

    return NextResponse.json({
      success: true,
      data: memories,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch memories' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    const body = await req.json();

    const { content, category, importance, projectName, projectId } = body;
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required.' }, { status: 400 });
    }

    const result = secondBrainService.saveMemory(userId, 'web:dashboard', {
      content,
      category,
      importance,
      projectName,
      projectId,
      source: 'Focus Desk UI',
    });

    return NextResponse.json({
      success: true,
      data: result.memory,
      isDuplicate: result.isDuplicate,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to save memory' },
      { status: 500 }
    );
  }
}
