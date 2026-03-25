import { NextRequest, NextResponse } from 'next/server';
import { secondBrainService } from '@/lib/second-brain/service';
import { getUserIdFromRequest } from '@/lib/second-brain/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || undefined;

    const brief = secondBrainService.getDailyBrief(userId, date);

    return NextResponse.json({
      success: true,
      data: brief,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to generate briefing' },
      { status: 500 }
    );
  }
}
