import { NextRequest } from 'next/server';
import { secondBrainService } from './service';

export function getUserIdFromRequest(req: NextRequest): string {
  // 1. Check Bearer token (if called with an API token)
  const authHeader = req.headers.get('authorization') || '';
  const tokenMatch = authHeader.match(/^Bearer\s+(sb_live_[a-zA-Z0-9_-]+)/);
  if (tokenMatch) {
    const validated = secondBrainService.validateToken(tokenMatch[1]);
    if (validated?.valid) {
      return validated.userId;
    }
  }

  // 2. Check header passed by client dashboard (e.g. from WorkOS user context)
  const headerUserId = req.headers.get('x-user-id');
  if (headerUserId && headerUserId.trim()) {
    return headerUserId.trim();
  }

  // 3. Fallback for guest / standalone desktop mode
  return 'user_default';
}
