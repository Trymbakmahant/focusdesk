import { NextRequest, NextResponse } from 'next/server';
import { secondBrainService } from '@/lib/second-brain/service';
import { getUserIdFromRequest } from '@/lib/second-brain/auth-helper';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    const body = await req.json();

    const { action, content, fileName, candidates } = body;

    // Action 1: Parse and extract candidates
    if (action === 'parse') {
      if (!content || typeof content !== 'string') {
        return NextResponse.json(
          { error: 'File content string is required for extraction.' },
          { status: 400 }
        );
      }
      const extracted = secondBrainService.parseConversationCandidates(content, fileName);
      return NextResponse.json({
        success: true,
        data: {
          candidates: extracted,
          total: extracted.length,
        },
      });
    }

    // Action 2: Save approved candidates
    if (action === 'approve') {
      if (!Array.isArray(candidates) || candidates.length === 0) {
        return NextResponse.json(
          { error: 'Approved candidates array is required.' },
          { status: 400 }
        );
      }

      const result = await secondBrainService.approveExtractedCandidates(
        userId,
        fileName || 'Imported File',
        candidates
      );

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Expected "parse" or "approve".' },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to process conversation import' },
      { status: 500 }
    );
  }
}
