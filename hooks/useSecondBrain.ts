"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  SecondBrainMemory,
  SecondBrainDecision,
  SecondBrainApiToken,
  SecondBrainAuditLog,
  DailyBriefingData,
  ExtractedCandidate,
  MemoryCategory,
  TaskPriority,
} from '@/types/second-brain';

export function useSecondBrain() {
  const { user } = useAuth();
  const userId = user?.id || 'user_default';

  const [briefing, setBriefing] = useState<DailyBriefingData | null>(null);
  const [memories, setMemories] = useState<SecondBrainMemory[]>([]);
  const [decisions, setDecisions] = useState<SecondBrainDecision[]>([]);
  const [tokens, setTokens] = useState<SecondBrainApiToken[]>([]);
  const [auditLogs, setAuditLogs] = useState<SecondBrainAuditLog[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Headers for scoped user requests
  const getHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      'x-user-id': userId,
    };
  }, [userId]);

  // 1. Fetch Daily Briefing
  const fetchBriefing = useCallback(async (date?: string) => {
    try {
      const url = date ? `/api/second-brain/brief?date=${encodeURIComponent(date)}` : '/api/second-brain/brief';
      const res = await fetch(url, { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        setBriefing(json.data);
      }
    } catch (err: any) {
      console.warn('Failed to fetch briefing:', err);
    }
  }, [getHeaders]);

  // 2. Fetch Memories
  const fetchMemories = useCallback(async (query?: string, category?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (query && query.trim()) params.set('q', query.trim());
      if (category && category !== 'all') params.set('category', category);

      const res = await fetch(`/api/second-brain/memories?${params.toString()}`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        setMemories(json.data || []);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load memories');
    } finally {
      setIsLoading(false);
    }
  }, [getHeaders]);

  // 3. Save Memory
  const saveMemory = useCallback(
    async (data: {
      content: string;
      category?: MemoryCategory;
      importance?: number;
      projectName?: string;
    }) => {
      try {
        const res = await fetch('/api/second-brain/memories', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data),
        });
        if (res.ok) {
          const json = await res.json();
          await fetchMemories(searchQuery, selectedCategory);
          await fetchBriefing();
          return json.data;
        }
      } catch (err) {
        console.error('Failed to save memory:', err);
      }
      return null;
    },
    [getHeaders, fetchMemories, fetchBriefing, searchQuery, selectedCategory]
  );

  // 4. Correct Memory
  const correctMemory = useCallback(
    async (memoryId: string, updatedContent: string, reason: string) => {
      try {
        const res = await fetch('/api/second-brain/memories/correct', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ memoryId, updatedContent, reason }),
        });
        if (res.ok) {
          await fetchMemories(searchQuery, selectedCategory);
          await fetchBriefing();
          return true;
        }
      } catch (err) {
        console.error('Failed to correct memory:', err);
      }
      return false;
    },
    [getHeaders, fetchMemories, fetchBriefing, searchQuery, selectedCategory]
  );

  // 5. Fetch Decisions
  const fetchDecisions = useCallback(async () => {
    try {
      const res = await fetch('/api/second-brain/decisions', { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        setDecisions(json.data || []);
      }
    } catch (err) {
      console.warn('Failed to load decisions:', err);
    }
  }, [getHeaders]);

  // 6. Record Decision
  const recordDecision = useCallback(
    async (data: {
      title: string;
      rationale: string;
      implications?: string;
      projectName?: string;
      supersedesDecisionId?: string;
    }) => {
      try {
        const res = await fetch('/api/second-brain/decisions', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data),
        });
        if (res.ok) {
          await fetchDecisions();
          await fetchBriefing();
          return true;
        }
      } catch (err) {
        console.error('Failed to record decision:', err);
      }
      return false;
    },
    [getHeaders, fetchDecisions, fetchBriefing]
  );

  // 7. Tokens Management
  const fetchTokens = useCallback(async () => {
    try {
      const res = await fetch('/api/second-brain/tokens', { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        setTokens(json.data || []);
      }
    } catch (err) {
      console.warn('Failed to load tokens:', err);
    }
  }, [getHeaders]);

  const generateToken = useCallback(
    async (name: string): Promise<{ rawToken: string; token: SecondBrainApiToken } | null> => {
      try {
        const res = await fetch('/api/second-brain/tokens', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ name }),
        });
        if (res.ok) {
          const json = await res.json();
          await fetchTokens();
          return json.data;
        }
      } catch (err) {
        console.error('Failed to generate token:', err);
      }
      return null;
    },
    [getHeaders, fetchTokens]
  );

  const revokeToken = useCallback(
    async (tokenId: string) => {
      try {
        const res = await fetch(`/api/second-brain/tokens?id=${encodeURIComponent(tokenId)}`, {
          method: 'DELETE',
          headers: getHeaders(),
        });
        if (res.ok) {
          await fetchTokens();
          return true;
        }
      } catch (err) {
        console.error('Failed to revoke token:', err);
      }
      return false;
    },
    [getHeaders, fetchTokens]
  );

  // 8. Conversation Extraction & Import
  const parseConversation = useCallback(
    async (content: string, fileName?: string): Promise<ExtractedCandidate[]> => {
      try {
        const res = await fetch('/api/second-brain/import', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ action: 'parse', content, fileName }),
        });
        if (res.ok) {
          const json = await res.json();
          return json.data?.candidates || [];
        }
      } catch (err) {
        console.error('Failed to parse conversation candidates:', err);
      }
      return [];
    },
    [getHeaders]
  );

  const approveCandidates = useCallback(
    async (fileName: string, candidates: ExtractedCandidate[]) => {
      try {
        const res = await fetch('/api/second-brain/import', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ action: 'approve', fileName, candidates }),
        });
        if (res.ok) {
          await fetchMemories();
          await fetchDecisions();
          await fetchBriefing();
          return true;
        }
      } catch (err) {
        console.error('Failed to approve candidates:', err);
      }
      return false;
    },
    [getHeaders, fetchMemories, fetchDecisions, fetchBriefing]
  );

  // 9. Audit Logs
  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/second-brain/audit', { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        setAuditLogs(json.data || []);
      }
    } catch (err) {
      console.warn('Failed to load audit logs:', err);
    }
  }, [getHeaders]);

  // Initial load
  useEffect(() => {
    fetchBriefing();
    fetchMemories();
    fetchDecisions();
    fetchTokens();
  }, [fetchBriefing, fetchMemories, fetchDecisions, fetchTokens]);

  return {
    briefing,
    memories,
    decisions,
    tokens,
    auditLogs,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    fetchBriefing,
    fetchMemories,
    saveMemory,
    correctMemory,
    fetchDecisions,
    recordDecision,
    fetchTokens,
    generateToken,
    revokeToken,
    parseConversation,
    approveCandidates,
    fetchAuditLogs,
  };
}
