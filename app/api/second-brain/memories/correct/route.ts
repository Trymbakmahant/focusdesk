import { NextRequest, NextResponse } from 'next/server';
import { secondBrainService } from '@/lib/second-brain/service';
import { getUserIdFromRequest } from '@/lib/second-brain/auth-helper';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    const body = await req.json();

    const { memoryId, updatedContent, reason } = body;
    if (!memoryId || !updatedContent) {
      return NextResponse.json(
        { error: 'memoryId and updatedContent are required.' },
        { status: 400 }
      );
    }

    const result = secondBrainService.correctMemory(
      userId,
      'web:dashboard',
      memoryId,
      updatedContent,
      reason || 'Updated via dashboard'
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to correct memory' },
      { status: 500 }
    );
  }
}
