"use client";

import React, { useState } from 'react';
import { useSecondBrain } from '@/hooks/useSecondBrain';
import { MemoryCategory, TaskPriority, ExtractedCandidate, SecondBrainMemory } from '@/types/second-brain';

type ActiveTab = 'briefing' | 'memories' | 'decisions' | 'import' | 'mcp';

export default function SecondBrainPage() {
  const {
    briefing,
    memories,
    decisions,
    tokens,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    fetchBriefing,
    fetchMemories,
    saveMemory,
    correctMemory,
    recordDecision,
    generateToken,
    revokeToken,
    parseConversation,
    approveCandidates,
  } = useSecondBrain();

  const [activeTab, setActiveTab] = useState<ActiveTab>('briefing');

  // Modals state
  const [showAddMemoryModal, setShowAddMemoryModal] = useState(false);
  const [newMemoryContent, setNewMemoryContent] = useState('');
  const [newMemoryCategory, setNewMemoryCategory] = useState<MemoryCategory>('fact');
  const [newMemoryImportance, setNewMemoryImportance] = useState(3);
  const [newMemoryProject, setNewMemoryProject] = useState('');

  // Correct Memory Modal state
  const [correctingMemory, setCorrectingMemory] = useState<SecondBrainMemory | null>(null);
  const [updatedContent, setUpdatedContent] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');

  // Decision Modal state
  const [showAddDecisionModal, setShowAddDecisionModal] = useState(false);
  const [decisionTitle, setDecisionTitle] = useState('');
  const [decisionRationale, setDecisionRationale] = useState('');
  const [decisionImplications, setDecisionImplications] = useState('');
  const [decisionProject, setDecisionProject] = useState('');

  // Token Modal state
  const [showNewTokenModal, setShowNewTokenModal] = useState(false);
  const [newTokenName, setNewTokenName] = useState('Claude Desktop');
  const [createdRawToken, setCreatedRawToken] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Import State
  const [importFileName, setImportFileName] = useState('');
  const [importContent, setImportContent] = useState('');
  const [extractedCandidates, setExtractedCandidates] = useState<ExtractedCandidate[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Copy helpers
  const [copiedConfigType, setCopiedConfigType] = useState<string | null>(null);

  const handleOpenCorrect = (memory: SecondBrainMemory) => {
    setCorrectingMemory(memory);
    setUpdatedContent(memory.content);
    setCorrectionReason('Information updated or refined');
  };

  const handleExecuteCorrection = async () => {
    if (!correctingMemory || !updatedContent.trim()) return;
    await correctMemory(correctingMemory.id, updatedContent.trim(), correctionReason.trim());
    setCorrectingMemory(null);
  };

  const handleSaveNewMemory = async () => {
    if (!newMemoryContent.trim()) return;
    await saveMemory({
      content: newMemoryContent.trim(),
      category: newMemoryCategory,
      importance: newMemoryImportance,
      projectName: newMemoryProject.trim() || undefined,
    });
    setNewMemoryContent('');
    setShowAddMemoryModal(false);
  };

  const handleSaveDecision = async () => {
    if (!decisionTitle.trim() || !decisionRationale.trim()) return;
    await recordDecision({
      title: decisionTitle.trim(),
      rationale: decisionRationale.trim(),
      implications: decisionImplications.trim() || undefined,
      projectName: decisionProject.trim() || undefined,
    });
    setDecisionTitle('');
    setDecisionRationale('');
    setDecisionImplications('');
    setShowAddDecisionModal(false);
  };

  const handleGenerateToken = async () => {
    if (!newTokenName.trim()) return;
    const res = await generateToken(newTokenName.trim());
    if (res?.rawToken) {
      setCreatedRawToken(res.rawToken);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      setImportContent(text);
      setIsParsing(true);
      const candidates = await parseConversation(text, file.name);
      setExtractedCandidates(candidates);
      setIsParsing(false);
    };
    reader.readAsText(file);
  };

  const handleApproveAll = async () => {
    if (extractedCandidates.length === 0) return;
    setImportStatus('Saving approved candidates to memory and tasks...');
    await approveCandidates(importFileName, extractedCandidates);
    setImportStatus('Successfully approved and saved items into Focus Desk Second Brain!');
    setExtractedCandidates([]);
    setTimeout(() => setImportStatus(null), 4000);
  };

  const toggleCandidateApproval = (id: string) => {
    setExtractedCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, approved: !c.approved } : c))
    );
  };

  const domainUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const mcpEndpointUrl = `${domainUrl}/mcp`;

  const claudeDesktopConfig = JSON.stringify(
    {
      mcpServers: {
        'focus-desk': {
          url: mcpEndpointUrl,
          headers: {
            Authorization: `Bearer ${tokens[0]?.tokenHint || 'sb_live_YOUR_TOKEN_HERE'}`,
          },
        },
      },
    },
    null,
    2
  );

  const cursorConfig = JSON.stringify(
    {
      mcpServers: {
        'focus-desk': {
          url: mcpEndpointUrl,
          headers: {
            Authorization: `Bearer ${tokens[0]?.tokenHint || 'sb_live_YOUR_TOKEN_HERE'}`,
          },
        },
      },
    },
    null,
    2
  );

  const copyConfig = (type: 'claude' | 'cursor', text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedConfigType(type);
    setTimeout(() => setCopiedConfigType(null), 2000);
  };

  return (
    <div className="flex flex-col max-w-6xl mx-auto w-full gap-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5856D6] to-[#007AFF] text-white flex items-center justify-center shadow-[0_4px_14px_rgba(88,86,214,0.35)]">
              <span className="material-symbols-outlined text-[22px]">neurology</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                  AI Second Brain &amp; Universal MCP Memory
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20 uppercase">
                  Personal AI OS
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Centralized knowledge, task execution, and decision log accessible by Claude, Cursor, and ChatGPT via MCP.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation Pill */}
        <div className="flex items-center p-1 rounded-2xl bg-black/5 dark:bg-white/[0.06] border border-black/5 dark:border-white/10 self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('briefing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
              activeTab === 'briefing'
                ? 'bg-white dark:bg-[#202125] text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] text-[#007AFF]">bolt</span>
            <span>Daily Briefing</span>
          </button>

          <button
            onClick={() => setActiveTab('memories')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
              activeTab === 'memories'
                ? 'bg-white dark:bg-[#202125] text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] text-[#5856D6]">psychology</span>
            <span>Memory Bank</span>
          </button>

          <button
            onClick={() => setActiveTab('decisions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
              activeTab === 'decisions'
                ? 'bg-white dark:bg-[#202125] text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] text-[#FF9500]">lightbulb</span>
            <span>Decisions</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
              activeTab === 'import'
                ? 'bg-white dark:bg-[#202125] text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] text-[#34C759]">file_upload</span>
            <span>Import</span>
          </button>

          <button
            onClick={() => setActiveTab('mcp')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
              activeTab === 'mcp'
                ? 'bg-white dark:bg-[#202125] text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] text-[#00C7BE]">key</span>
            <span>MCP &amp; Keys</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DAILY BRIEFING */}
      {/* ========================================================================= */}
      {activeTab === 'briefing' && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          {/* Main Briefing Banner */}
          <div className="rounded-3xl bg-white/70 dark:bg-[#1A1B1E]/85 backdrop-blur-[36px] border border-black/5 dark:border-white/10 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                    Live Operational Status • {briefing?.date}
                  </h2>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Deterministic query synthesis • 0 token LLM cost • Instant response
                  </p>
                </div>
              </div>
              <button
                onClick={() => fetchBriefing()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors"
              >
                <span className="material-symbols-outlined text-[15px]">refresh</span>
                <span>Refresh</span>
              </button>
            </div>

            {/* Markdown Summary Box */}
            <div className="mt-4 p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 font-mono text-xs leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-line">
              {briefing?.summaryText || 'Loading briefing...'}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: UNIVERSAL MEMORY BANK */}
      {/* ========================================================================= */}
      {activeTab === 'memories' && (
        <div className="flex flex-col gap-5 animate-fadeIn">
          {/* Top Controls: Search, Category Filters, Add Memory */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-gray-400">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  fetchMemories(e.target.value, selectedCategory);
                }}
                placeholder="Search memories via RRF hybrid keyword & semantic..."
                className="w-full pl-9 pr-4 py-2 rounded-2xl bg-white/70 dark:bg-[#1A1B1E]/80 backdrop-blur-md border border-black/5 dark:border-white/10 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              {(['all', 'fact', 'preference', 'lesson', 'note'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    fetchMemories(searchQuery, cat);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-[#007AFF] text-white shadow-xs'
                      : 'bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}

              <button
                onClick={() => setShowAddMemoryModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#007AFF] to-[#5856D6] text-white text-xs font-semibold hover:opacity-95 shadow-sm transition-all ml-auto shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Save Memory</span>
              </button>
            </div>
          </div>

          {/* Memories Grid */}
          {memories.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-white/50 dark:bg-[#1A1B1E]/50 border border-black/5 dark:border-white/10">
              <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">neurology</span>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No memories found</p>
              <p className="text-xs text-gray-400 mt-1">
                Add a memory manually or connect an AI assistant via MCP to capture knowledge automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {memories.map((mem) => (
                <div
                  key={mem.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 shadow-xs ${
                    mem.isActive
                      ? 'bg-white/80 dark:bg-[#1E1F23]/80 border-black/5 dark:border-white/10 hover:border-[#007AFF]/30'
                      : 'bg-gray-100/50 dark:bg-white/[0.02] border-dashed border-gray-300 dark:border-gray-700 opacity-60'
                  }`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            mem.category === 'preference'
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                              : mem.category === 'lesson'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : mem.category === 'note'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          {mem.category}
                        </span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[13px] text-amber-400">star</span>
                          <span>{mem.importance}/5</span>
                        </span>
                      </div>

                      {!mem.isActive ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-gray-200 dark:bg-white/10 text-gray-500 uppercase font-semibold">
                          Superseded
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-mono">
                          {new Date(mem.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-900 dark:text-white leading-relaxed font-normal">
                      {mem.content}
                    </p>

                    {mem.metadata?.correctionReason && (
                      <p className="text-[11px] text-indigo-600 dark:text-indigo-400 italic">
                        ↳ Reason: {mem.metadata.correctionReason}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
                    <span className="text-[10px] text-gray-400">
                      Provenance: {mem.sourceType || 'system'}
                    </span>
                    {mem.isActive && (
                      <button
                        onClick={() => handleOpenCorrect(mem)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-[#007AFF] hover:underline cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit_note</span>
                        <span>Correct Memory</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DECISION LOG */}
      {/* ========================================================================= */}
      {activeTab === 'decisions' && (
        <div className="flex flex-col gap-5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Architectural &amp; Strategic Decision Log
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Immutable records of technical choices, rationales, and supersession links.
              </p>
            </div>
            <button
              onClick={() => setShowAddDecisionModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5856D6] text-white text-xs font-semibold hover:opacity-95 shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Record Decision</span>
            </button>
          </div>

          <div className="relative pl-6 border-l-2 border-[#5856D6]/30 flex flex-col gap-6 ml-3">
            {decisions.map((dec) => (
              <div key={dec.id} className="relative flex flex-col gap-2">
                {/* Timeline node icon */}
                <div className="absolute -left-[31px] top-1 w-5 h-5 rounded-full bg-[#5856D6] border-2 border-white dark:border-[#141517] flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[11px]">check</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#1E1F23]/80 border border-black/5 dark:border-white/10 shadow-xs flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {dec.title}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        dec.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-gray-200 dark:bg-white/10 text-gray-500'
                      }`}
                    >
                      {dec.status}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Rationale:
                    </span>
                    <p className="text-xs text-gray-800 dark:text-gray-200 mt-0.5">
                      {dec.rationale}
                    </p>
                  </div>

                  {dec.implications && (
                    <div>
                      <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Trade-offs &amp; Implications:
                      </span>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                        {dec.implications}
                      </p>
                    </div>
                  )}

                  <span className="text-[10px] text-gray-400 font-mono mt-1">
                    Recorded: {new Date(dec.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CONVERSATION IMPORT */}
      {/* ========================================================================= */}
      {activeTab === 'import' && (
        <div className="flex flex-col gap-5 animate-fadeIn">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Conversation &amp; Notes Extraction Pipeline
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Drag-and-drop chat exports (.md, .txt) from Claude, ChatGPT, or Cursor to automatically extract candidate memories, decisions, and tasks.
            </p>
          </div>

          {/* Upload Dropzone */}
          <div className="p-8 rounded-3xl border-2 border-dashed border-black/10 dark:border-white/15 bg-white/40 dark:bg-white/[0.02] flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">upload_file</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Upload Markdown or Plain Text Conversation
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Supports .md and .txt exports</p>
            </div>
            <label className="px-4 py-2 rounded-xl bg-[#007AFF] text-white text-xs font-semibold cursor-pointer hover:bg-[#0062cc] transition-colors shadow-sm">
              <span>Select File</span>
              <input type="file" accept=".md,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {importStatus && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
              {importStatus}
            </div>
          )}

          {/* Extracted Candidates Preview */}
          {extractedCandidates.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  Extracted Candidates ({extractedCandidates.length})
                </span>
                <button
                  onClick={handleApproveAll}
                  className="px-4 py-1.5 rounded-xl bg-[#34C759] text-white text-xs font-semibold hover:bg-[#2eb34f] transition-all shadow-sm"
                >
                  Approve &amp; Save All
                </button>
              </div>

              <div className="flex flex-col gap-2.5">
                {extractedCandidates.map((c) => (
                  <div
                    key={c.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      c.approved
                        ? 'bg-white/80 dark:bg-[#1E1F23]/80 border-black/5 dark:border-white/10'
                        : 'bg-black/[0.02] dark:bg-white/[0.02] border-transparent opacity-50'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={c.approved}
                        onChange={() => toggleCandidateApproval(c.id)}
                        className="mt-1 w-4 h-4 rounded text-[#007AFF] cursor-pointer"
                      />
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-gray-800 dark:text-gray-200">
                            {c.type}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-semibold">
                            {Math.round(c.confidence * 100)}% Confidence
                          </span>
                        </div>
                        <p className="text-xs text-gray-900 dark:text-white leading-snug">
                          {c.content || c.title}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: MCP & API TOKENS */}
      {/* ========================================================================= */}
      {activeTab === 'mcp' && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          {/* Endpoint Card */}
          <div className="p-5 rounded-3xl bg-white/70 dark:bg-[#1A1B1E]/85 border border-black/5 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Remote Streamable HTTP Endpoint
              </span>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-sm font-mono font-bold text-[#007AFF] bg-[#007AFF]/10 px-3 py-1 rounded-xl">
                  {mcpEndpointUrl}
                </code>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">
                Official @modelcontextprotocol/sdk v1.32.2 over WebStandardStreamableHTTPServerTransport
              </p>
            </div>

            <button
              onClick={() => {
                setShowNewTokenModal(true);
                setCreatedRawToken(null);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#007AFF] to-[#5856D6] text-white text-xs font-semibold shadow-sm hover:opacity-95 transition-all self-start md:self-auto cursor-pointer"
            >
              Generate New API Token
            </button>
          </div>

          {/* Active Tokens Table */}
          <div className="p-5 rounded-3xl bg-white/70 dark:bg-[#1A1B1E]/85 border border-black/5 dark:border-white/10 shadow-sm flex flex-col gap-3">
            <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Connected AI Client Tokens
            </span>

            {tokens.length === 0 ? (
              <p className="text-xs text-gray-400 py-3">No tokens generated yet. Click above to create one.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {tokens.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px] text-[#007AFF]">smart_toy</span>
                      <div>
                        <span className="font-semibold text-gray-900 dark:text-white">{t.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <code className="text-[11px] font-mono text-gray-500">{t.tokenHint}</code>
                          <span className="text-[10px] text-gray-400">
                            Created: {new Date(t.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => revokeToken(t.id)}
                      className="px-3 py-1 rounded-xl text-[11px] font-semibold text-red-600 hover:bg-red-500/10 transition-colors"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Copy-Paste Configurations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Claude Desktop Config */}
            <div className="p-5 rounded-3xl bg-white/70 dark:bg-[#1A1B1E]/85 border border-black/5 dark:border-white/10 flex flex-col justify-between gap-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    Claude Desktop Configuration
                  </span>
                  <p className="text-[11px] text-gray-400">~/Library/Application Support/Claude/claude_desktop_config.json</p>
                </div>
                <button
                  onClick={() => copyConfig('claude', claudeDesktopConfig)}
                  className="px-3 py-1 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-xs font-semibold text-gray-700 dark:text-gray-300"
                >
                  {copiedConfigType === 'claude' ? 'Copied!' : 'Copy JSON'}
                </button>
              </div>
              <pre className="p-3 rounded-2xl bg-black/[0.04] dark:bg-white/[0.03] text-[11px] font-mono text-gray-800 dark:text-gray-200 overflow-x-auto">
                {claudeDesktopConfig}
              </pre>
            </div>

            {/* Cursor Config */}
            <div className="p-5 rounded-3xl bg-white/70 dark:bg-[#1A1B1E]/85 border border-black/5 dark:border-white/10 flex flex-col justify-between gap-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    Cursor IDE MCP Configuration
                  </span>
                  <p className="text-[11px] text-gray-400">.cursor/mcp.json</p>
                </div>
                <button
                  onClick={() => copyConfig('cursor', cursorConfig)}
                  className="px-3 py-1 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-xs font-semibold text-gray-700 dark:text-gray-300"
                >
                  {copiedConfigType === 'cursor' ? 'Copied!' : 'Copy JSON'}
                </button>
              </div>
              <pre className="p-3 rounded-2xl bg-black/[0.04] dark:bg-white/[0.03] text-[11px] font-mono text-gray-800 dark:text-gray-200 overflow-x-auto">
                {cursorConfig}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CORRECT MEMORY (Historical Provenance Preserved) */}
      {/* ========================================================================= */}
      {correctingMemory && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/10 dark:border-white/15 p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#007AFF] text-xl">edit_note</span>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Correct Memory Item</h3>
              </div>
              <button
                onClick={() => setCorrectingMemory(null)}
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] text-xs text-gray-600 dark:text-gray-300">
              <span className="font-bold text-gray-500 text-[10px] uppercase">Original Version:</span>
              <p className="mt-1">{correctingMemory.content}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
                Updated Accurate Content:
              </label>
              <textarea
                rows={3}
                value={updatedContent}
                onChange={(e) => setUpdatedContent(e.target.value)}
                className="w-full p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
                Correction Reason (Recorded in Provenance Audit):
              </label>
              <input
                type="text"
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="e.g. Schedule updated, requirements refined"
                className="w-full p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs text-gray-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCorrectingMemory(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-black/5 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteCorrection}
                className="px-4 py-2 rounded-xl bg-[#007AFF] text-white text-xs font-semibold hover:bg-[#0062cc]"
              >
                Save Correction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD MEMORY */}
      {/* ========================================================================= */}
      {showAddMemoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/10 dark:border-white/15 p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Save Knowledge to Memory</h3>
              <button
                onClick={() => setShowAddMemoryModal(false)}
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
                Memory Content:
              </label>
              <textarea
                rows={3}
                value={newMemoryContent}
                onChange={(e) => setNewMemoryContent(e.target.value)}
                placeholder="e.g. The database uses pgvector for semantic cosine similarity search..."
                className="w-full p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
                  Category:
                </label>
                <select
                  value={newMemoryCategory}
                  onChange={(e) => setNewMemoryCategory(e.target.value as MemoryCategory)}
                  className="w-full p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs text-gray-900 dark:text-white"
                >
                  <option value="fact">Fact</option>
                  <option value="preference">Preference</option>
                  <option value="lesson">Lesson</option>
                  <option value="note">Note</option>
                  <option value="project_context">Project Context</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
                  Importance (1 to 5):
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={newMemoryImportance}
                  onChange={(e) => setNewMemoryImportance(parseInt(e.target.value, 10))}
                  className="w-full p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddMemoryModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-black/5 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewMemory}
                className="px-4 py-2 rounded-xl bg-[#007AFF] text-white text-xs font-semibold hover:bg-[#0062cc]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD DECISION */}
      {/* ========================================================================= */}
      {showAddDecisionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/10 dark:border-white/15 p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Record Architecture Decision</h3>
              <button
                onClick={() => setShowAddDecisionModal(false)}
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
                Decision Title:
              </label>
              <input
                type="text"
                value={decisionTitle}
                onChange={(e) => setDecisionTitle(e.target.value)}
                placeholder="e.g. Use Drizzle ORM with second_brain PostgreSQL schema"
                className="w-full p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs text-gray-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
                Rationale (Why this was chosen):
              </label>
              <textarea
                rows={3}
                value={decisionRationale}
                onChange={(e) => setDecisionRationale(e.target.value)}
                placeholder="Explain the background, trade-offs, and alternative approaches..."
                className="w-full p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5856D6]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddDecisionModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-black/5 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDecision}
                className="px-4 py-2 rounded-xl bg-[#5856D6] text-white text-xs font-semibold hover:opacity-95"
              >
                Record Decision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GENERATE API TOKEN (Copy-Once Modal) */}
      {/* ========================================================================= */}
      {showNewTokenModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/10 dark:border-white/15 p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#007AFF] text-xl">key</span>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Generate MCP API Token</h3>
              </div>
              <button
                onClick={() => setShowNewTokenModal(false)}
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {!createdRawToken ? (
              <>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Generate a high-entropy Bearer token (`sb_live_...`) to connect Claude Desktop, Cursor, or ChatGPT to your Focus Desk Second Brain.
                </p>
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
                    Client Name:
                  </label>
                  <input
                    type="text"
                    value={newTokenName}
                    onChange={(e) => setNewTokenName(e.target.value)}
                    placeholder="e.g. Claude Desktop (MacBook Pro)"
                    className="w-full p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs text-gray-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowNewTokenModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateToken}
                    className="px-4 py-2 rounded-xl bg-[#007AFF] text-white text-xs font-semibold hover:bg-[#0062cc]"
                  >
                    Generate Token
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
                  <span className="font-bold">⚠️ Copy this token now.</span> For security, only the SHA-256 hash is saved. You will not be able to view it again.
                </div>

                <div className="flex items-center gap-2 p-3 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] border border-black/10 dark:border-white/10">
                  <code className="text-xs font-mono font-bold text-gray-900 dark:text-white flex-1 select-all break-all">
                    {createdRawToken}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdRawToken);
                      setCopiedToken(true);
                      setTimeout(() => setCopiedToken(false), 2000);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#007AFF] text-white text-xs font-semibold shrink-0"
                  >
                    {copiedToken ? 'Copied!' : 'Copy Token'}
                  </button>
                </div>

                <button
                  onClick={() => setShowNewTokenModal(false)}
                  className="w-full py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-xs font-semibold text-gray-700 dark:text-gray-300 mt-2"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
