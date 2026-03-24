import { NextRequest } from 'next/server';
import { handleMcpStreamableRequest } from '@/lib/second-brain/mcp-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  return handleMcpStreamableRequest(req);
}

export async function GET(req: NextRequest) {
  return handleMcpStreamableRequest(req);
}

export async function OPTIONS(req: NextRequest) {
  return handleMcpStreamableRequest(req);
}

export async function DELETE(req: NextRequest) {
  return handleMcpStreamableRequest(req);
}
