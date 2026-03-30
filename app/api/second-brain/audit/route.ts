import { NextRequest, NextResponse } from 'next/server';
import { secondBrainService } from '@/lib/second-brain/service';
import { getUserIdFromRequest } from '@/lib/second-brain/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const logs = secondBrainService.getAuditLogs(userId, limit);

    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
