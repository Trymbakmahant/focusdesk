"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FocusDeckHarness } from '@/lib/harness/clientHarness';
import { FOCUSDECK_TOOL_REGISTRY } from '@/lib/harness/toolRegistry';
import { parseVoiceCommand } from '@/lib/harness/voiceParser';
import { HarnessToolDefinition, HarnessExecutionLog, ToolExecutionResult } from '@/types/harness';

interface AgentVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VOICE_PRESETS = [
  { label: 'Start 25m Timer', prompt: 'start a focus timer for 25 minutes', icon: 'timelapse' },
  { label: 'Pause Timer', prompt: 'pause focus timer', icon: 'pause_circle' },
  { label: 'Switch to Feed View', prompt: 'switch to feed view', icon: 'view_agenda' },
  { label: 'Switch to Canvas View', prompt: 'switch to canvas view', icon: 'dashboard' },
  { label: 'What is Next Meeting?', prompt: 'what is my next meeting', icon: 'event' },
  { label: 'Set Focus Intention', prompt: 'set focus today to Ship Rust Tauri IPC', icon: 'psychology' },
  { label: 'Add Quick Task', prompt: 'add task review PR for Supabase integration', icon: 'check_circle' },
  { label: 'Log Water Habit', prompt: 'log water habit', icon: 'water_drop' },
];

export default function AgentVoiceModal({ isOpen, onClose }: AgentVoiceModalProps) {
  const [activeTab, setActiveTab] = useState<'voice' | 'tools' | 'logs'>('voice');
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastResult, setLastResult] = useState<ToolExecutionResult | null>(null);
  const [logs, setLogs] = useState<HarnessExecutionLog[]>([]);
  const [selectedTool, setSelectedTool] = useState<HarnessToolDefinition>(FOCUSDECK_TOOL_REGISTRY[0]);
  const [toolParamInputs, setToolParamInputs] = useState<Record<string, any>>({});
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef<any>(null);

  // Sync execution logs from harness
  useEffect(() => {
    setLogs(FocusDeckHarness.getExecutionLogs());
    const unsubscribe = FocusDeckHarness.onExecution((newLog) => {
      setLogs((prev) => [newLog, ...prev.slice(0, 49)]);
    });
    return () => unsubscribe();
  }, []);

  // Web Speech API initialization
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setSpeechSupported(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      recognition.onresult = (event: any) => {
        let current = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        setTranscript(current);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Auto-execute when speech stops and transcript is present
  useEffect(() => {
    if (!isListening && transcript.trim()) {
      handleRunVoicePrompt(transcript);
    }
  }, [isListening, transcript]);

  const toggleVoiceListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        setLastResult(null);
        setTranscript('');
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Error starting speech recognition:', err);
      }
    }
  }, [isListening]);

  const handleRunVoicePrompt = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed) return;

    const result = await FocusDeckHarness.executeVoiceCommand(trimmed);
    setLastResult(result);
  };

  const handleRunSelectedTool = async () => {
    if (!selectedTool) return;
    const result = await FocusDeckHarness.executeTool(selectedTool.name, toolParamInputs, 'manual');
    setLastResult(result);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fadeIn">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-3xl bg-surface-container-lowest/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-outline-variant/30 flex flex-col max-h-[85vh] overflow-hidden text-on-surface">
        {/* Modal Header */}
        <div className="px-space-lg py-space-md border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-on-primary shadow-sm">
              <span className="material-symbols-outlined text-[24px]">smart_toy</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  FocusDeck Agent &amp; Voice Harness
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[11px] font-semibold">
                  v1.0 Ready
                </span>
              </div>
              <p className="text-xs text-outline">
                Control every tool with voice commands or autonomous AI agents via MCP &amp; function calling
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-surface-container flex items-center justify-center text-outline hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-space-lg pt-3 pb-2 border-b border-outline-variant/15 bg-surface-container-low/20">
          <button
            type="button"
            onClick={() => setActiveTab('voice')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'voice'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-outline hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">mic</span>
            <span>Voice &amp; Natural Language</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tools')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'tools'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-outline hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>Tool Registry ({FOCUSDECK_TOOL_REGISTRY.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'logs'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-outline hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">history</span>
            <span>Audit Logs ({logs.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-space-lg flex flex-col gap-space-md">
          {/* TAB 1: VOICE & NATURAL LANGUAGE */}
          {activeTab === 'voice' && (
            <div className="flex flex-col gap-space-md">
              {/* Voice Interaction Hero Box */}
              <div className="p-space-lg rounded-2xl bg-gradient-to-br from-primary-fixed/30 via-surface-container-low to-secondary-container/20 border border-outline-variant/30 flex flex-col items-center text-center gap-3">
                <button
                  type="button"
                  onClick={toggleVoiceListening}
                  className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-105 ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse ring-8 ring-red-500/20'
                      : 'bg-primary text-on-primary hover:bg-primary-hover'
                  }`}
                  title={isListening ? 'Click to stop listening' : 'Click to start voice command'}
                >
                  <span className="material-symbols-outlined text-[36px]">
                    {isListening ? 'graphic_eq' : 'mic'}
                  </span>
                </button>

                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-sm text-on-surface">
                    {isListening
                      ? 'Listening to your voice command...'
                      : speechSupported
                      ? 'Click microphone to speak or type below'
                      : 'Web Speech API not supported in this browser (use text input below)'}
                  </span>
                  <span className="text-xs text-outline">
                    {transcript
                      ? `"${transcript}"`
                      : 'Example: "Start a 45 minute focus timer" or "Switch to feed view"'}
                  </span>
                </div>
              </div>

              {/* Natural Language Prompt Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRunVoicePrompt(inputText);
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3.5 top-3 text-[18px] text-outline">
                    keyboard
                  </span>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type natural language command or tool call (e.g., 'start a 30m focus timer')..."
                    className="w-full bg-surface-container-low pl-10 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm text-on-surface placeholder:text-outline border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="px-4 py-2.5 rounded-2xl bg-primary text-on-primary text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5"
                >
                  <span>Execute</span>
                  <span className="material-symbols-outlined text-[16px]">send</span>
                </button>
              </form>

              {/* Execution Feedback Banner */}
              {lastResult && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between animate-fadeIn ${
                    lastResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">
                      {lastResult.success ? 'check_circle' : 'error'}
                    </span>
                    <span className="font-medium">{lastResult.message}</span>
                  </div>
                  <span className="font-mono text-[10px] opacity-75">
                    {new Date(lastResult.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              )}

              {/* Quick Voice Command Presets */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-outline uppercase tracking-wider">
                  Voice Command Quick Triggers
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {VOICE_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setInputText(p.prompt);
                        handleRunVoicePrompt(p.prompt);
                      }}
                      className="p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-left border border-outline-variant/20 hover:border-primary/40 transition-all flex flex-col gap-1 text-xs group"
                    >
                      <div className="flex items-center justify-between text-outline group-hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[18px]">{p.icon}</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </div>
                      <span className="font-semibold text-on-surface">{p.label}</span>
                      <span className="text-[10px] text-outline truncate">{p.prompt}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TOOL REGISTRY INSPECTOR */}
          {activeTab === 'tools' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Tool List Sidebar */}
              <div className="md:col-span-5 flex flex-col gap-1 max-h-[500px] overflow-y-auto pr-1">
                <span className="text-[11px] font-semibold text-outline uppercase tracking-wider pb-1">
                  Registered Functions ({FOCUSDECK_TOOL_REGISTRY.length})
                </span>
                {FOCUSDECK_TOOL_REGISTRY.map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => {
                      setSelectedTool(t);
                      setToolParamInputs({});
                      setLastResult(null);
                    }}
                    className={`p-2.5 rounded-xl text-left transition-all flex items-center justify-between border ${
                      selectedTool.name === t.name
                        ? 'bg-primary/15 border-primary/40 text-primary font-semibold'
                        : 'bg-surface-container-low/70 border-outline-variant/15 text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-mono text-xs">{t.name}</span>
                      <span className="text-[10px] text-outline capitalize">{t.category}</span>
                    </div>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                ))}
              </div>

              {/* Tool Detail & Interactive Runner */}
              <div className="md:col-span-7 p-4 rounded-2xl bg-surface-container-low/60 border border-outline-variant/20 flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/15">
                  <div>
                    <h3 className="font-mono text-sm font-semibold text-on-surface">
                      {selectedTool.name}
                    </h3>
                    <span className="text-[11px] text-outline capitalize">
                      Category: <strong>{selectedTool.category}</strong>
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-secondary/10 text-secondary text-[11px] font-mono">
                    OpenAI / MCP Tool
                  </span>
                </div>

                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {selectedTool.description}
                </p>

                {/* Parameters Form */}
                <div className="flex flex-col gap-2 pt-1">
                  <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">
                    Parameters Schema
                  </span>
                  {Object.keys(selectedTool.parameters.properties).length === 0 ? (
                    <span className="text-xs text-outline italic">No required parameters (void function).</span>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {Object.entries(selectedTool.parameters.properties).map(([paramKey, schema]) => (
                        <div key={paramKey} className="flex flex-col gap-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-mono text-[11px] font-medium text-on-surface">
                              {paramKey}
                              {selectedTool.parameters.required?.includes(paramKey) && (
                                <span className="text-red-500 ml-0.5">*</span>
                              )}
                            </span>
                            <span className="text-[10px] text-outline">{schema.type}</span>
                          </div>
                          {schema.enum ? (
                            <select
                              value={toolParamInputs[paramKey] || schema.default || schema.enum[0]}
                              onChange={(e) =>
                                setToolParamInputs((prev) => ({ ...prev, [paramKey]: e.target.value }))
                              }
                              className="w-full bg-surface-container p-2 rounded-xl text-xs text-on-surface border border-outline-variant/30 outline-none"
                            >
                              {schema.enum.map((opt) => (
                                <option key={String(opt)} value={String(opt)}>
                                  {String(opt)}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={schema.type === 'integer' || schema.type === 'number' ? 'number' : 'text'}
                              value={toolParamInputs[paramKey] ?? (schema.default || '')}
                              placeholder={schema.description}
                              onChange={(e) =>
                                setToolParamInputs((prev) => ({
                                  ...prev,
                                  [paramKey]:
                                    schema.type === 'integer'
                                      ? parseInt(e.target.value, 10)
                                      : e.target.value,
                                }))
                              }
                              className="w-full bg-surface-container p-2 rounded-xl text-xs text-on-surface border border-outline-variant/30 outline-none"
                            />
                          )}
                          <span className="text-[10px] text-outline">{schema.description}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Voice Triggers */}
                {selectedTool.voiceTriggers.length > 0 && (
                  <div className="flex flex-col gap-1 pt-1">
                    <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">
                      Voice Trigger Sample
                    </span>
                    <div className="p-2 rounded-xl bg-surface-container text-xs font-mono text-outline flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px] text-primary">mic</span>
                      <span>&quot;{selectedTool.voiceTriggers[0].example}&quot;</span>
                    </div>
                  </div>
                )}

                {/* Execute Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleRunSelectedTool}
                    className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                    <span>Test Tool Execution</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs text-outline pb-1 border-b border-outline-variant/15">
                <span>Recent Tool Invocations</span>
                <span>Showing last {logs.length} calls</span>
              </div>

              {logs.length === 0 ? (
                <div className="p-8 text-center text-xs text-outline">
                  No tool invocations recorded yet. Speak a voice command or test a tool from the registry!
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 max-h-[450px] overflow-y-auto pr-1">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              log.result.success ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                          />
                          <span className="font-mono font-semibold text-on-surface">{log.toolName}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-surface-container font-medium text-outline uppercase">
                            {log.source}
                          </span>
                        </div>
                        <span className="text-[10px] text-outline">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <p className="text-on-surface-variant pl-4 text-[11px]">{log.result.message}</p>

                      {Object.keys(log.parameters).length > 0 && (
                        <div className="pl-4 pt-0.5 font-mono text-[10px] text-outline">
                          Args: {JSON.stringify(log.parameters)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-space-lg py-3 border-t border-outline-variant/20 bg-surface-container-low/40 flex items-center justify-between text-xs text-outline">
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded bg-surface-container text-[10px] font-mono text-on-surface">⌘K</kbd>
            <span>Press ⌘K anytime to open Agent Harness</span>
          </div>
          <span className="text-primary font-medium">Ready for Autonomous LLM Agents &amp; Voice</span>
        </div>
      </div>
    </div>
  );
}
