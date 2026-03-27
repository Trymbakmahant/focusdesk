import { NextRequest, NextResponse } from 'next/server';
import { secondBrainService } from '@/lib/second-brain/service';
import { getUserIdFromRequest } from '@/lib/second-brain/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId') || undefined;

    const decisions = secondBrainService.listDecisions(userId, projectId);

    return NextResponse.json({
      success: true,
      data: decisions,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch decisions' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    const body = await req.json();

    const { title, rationale, implications, projectName, projectId, supersedesDecisionId } = body;
    if (!title || !rationale) {
      return NextResponse.json(
        { error: 'title and rationale are required.' },
        { status: 400 }
      );
    }

    const decision = secondBrainService.recordDecision(userId, 'web:dashboard', {
      title,
      rationale,
      implications,
      projectName,
      projectId,
      supersedesDecisionId,
    });

    return NextResponse.json({
      success: true,
      data: decision,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to record decision' },
      { status: 500 }
    );
  }
}
