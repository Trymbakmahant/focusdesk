import { NextRequest, NextResponse } from 'next/server';
import { secondBrainService } from '@/lib/second-brain/service';
import { getUserIdFromRequest } from '@/lib/second-brain/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    const tokens = secondBrainService.listApiTokens(userId);

    return NextResponse.json({
      success: true,
      data: tokens,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to list tokens' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    const body = await req.json();
    const { name } = body;

    const { rawToken, token } = secondBrainService.generateApiToken(
      userId,
      name || 'AI Client'
    );

    return NextResponse.json({
      success: true,
      data: {
        rawToken, // Sent ONLY once!
        token,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to generate token' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    const { searchParams } = new URL(req.url);
    const tokenId = searchParams.get('id');

    if (!tokenId) {
      return NextResponse.json({ error: 'Token id is required.' }, { status: 400 });
    }

    const revoked = secondBrainService.revokeApiToken(userId, tokenId);

    return NextResponse.json({
      success: revoked,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to revoke token' },
      { status: 500 }
    );
  }
}
