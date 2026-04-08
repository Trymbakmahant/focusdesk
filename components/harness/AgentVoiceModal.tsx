"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FixatesHarness } from '@/lib/harness/clientHarness';
import { FIXATES_TOOL_REGISTRY } from '@/lib/harness/toolRegistry';
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
  const [isThinking, setIsThinking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastResult, setLastResult] = useState<ToolExecutionResult | null>(null);
  const [logs, setLogs] = useState<HarnessExecutionLog[]>([]);
  const [selectedTool, setSelectedTool] = useState<HarnessToolDefinition>(FIXATES_TOOL_REGISTRY[0]);
  const [toolParamInputs, setToolParamInputs] = useState<Record<string, any>>({});
  const [speechSupported, setSpeechSupported] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Multi-turn conversational memory
  const [messages, setMessages] = useState<
    Array<{ id: string; role: 'user' | 'assistant'; content: string; toolName?: string; success?: boolean }>
  >([]);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxIdleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentTranscriptRef = useRef<string>('');
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Sync execution logs from harness
  useEffect(() => {
    setLogs(FixatesHarness.getExecutionLogs());
    const unsubscribe = FixatesHarness.onExecution((newLog) => {
      setLogs((prev) => [newLog, ...prev.slice(0, 49)]);
    });
    return () => unsubscribe();
  }, []);

  // Browser Text-To-Speech (TTS)
  const speakResponse = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!ttsEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
        if (onEnd) onEnd();
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        if (onEnd) onEnd();
      };

      utterance.onerror = () => {
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    },
    [ttsEnabled]
  );

  // Stop listening helper
  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsDebouncing(false);
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (maxIdleTimerRef.current) {
      clearTimeout(maxIdleTimerRef.current);
      maxIdleTimerRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  }, []);

  // Web Speech API initialization with robust continuous listening
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setSpeechSupported(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true; // Stay alive continuously!
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
        setVoiceError(null);
      };

      recognition.onresult = (event: any) => {
        setVoiceError(null);
        let interim = '';
        let final = '';
        for (let i = 0; i < event.results.length; i++) {
          const item = event.results[i];
          if (item && item[0]) {
            if (item.isFinal) {
              final += item[0].transcript + ' ';
            } else {
              interim += item[0].transcript;
            }
          }
        }
        const currentText = (final + interim).trim();
        if (currentText) {
          setTranscript(currentText);
          currentTranscriptRef.current = currentText;
          // Live translate speech into text in the bottom input bar in real time
          setInputText(currentText);
          setIsDebouncing(true);

          // Clear max idle timer since user is actively speaking
          if (maxIdleTimerRef.current) {
            clearTimeout(maxIdleTimerRef.current);
            maxIdleTimerRef.current = null;
          }

          // Debounce: wait exactly 1 second (1000ms) of silence after user finishes speaking before calling API
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }
          silenceTimerRef.current = setTimeout(() => {
            const textToSubmit = currentTranscriptRef.current.trim();
            setIsDebouncing(false);
            if (textToSubmit && isListeningRef.current) {
              stopListening();
              handleRunVoicePrompt(textToSubmit);
            }
          }, 1000);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition status:', event.error);
        if (event.error === 'no-speech') {
          return;
        }
        if (event.error === 'not-allowed') {
          setVoiceError('Microphone permission blocked. Please allow microphone access in your browser or macOS Settings.');
          stopListening();
          return;
        }
        if (event.error === 'network') {
          const isArc = typeof window !== 'undefined' && ((window as any).arc || navigator.userAgent.includes('Arc'));
          if (isArc) {
            setVoiceError('Arc browser does not support Web Speech Recognition (Google Speech API keys are not included in Arc). Please open http://localhost:3000 in Google Chrome, or type your command in the box below.');
          } else {
            setVoiceError('Speech recognition network error. Arc & Brave block Google Speech cloud servers. Test at http://localhost:3000 in Google Chrome, or type your command below.');
          }
          stopListening();
          return;
        }
        if (event.error === 'service-not-allowed') {
          setVoiceError('Speech recognition blocked by browser/OS. In macOS, ensure Siri & Dictation is enabled in System Settings.');
          stopListening();
          return;
        }
        if (event.error === 'audio-capture') {
          setVoiceError('No microphone detected or microphone is in use by another app.');
          stopListening();
          return;
        }
        setVoiceError(`Speech error: ${event.error}`);
      };

      recognition.onend = () => {
        // If the browser unexpectedly terminates onend while listening was intended to be on, restart it!
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch {}
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      stopListening();
    };
  }, [stopListening]);

  // Clean up when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopListening();
      window.speechSynthesis?.cancel();
    }
  }, [isOpen, stopListening]);

  const startListening = useCallback(async () => {
    if (!recognitionRef.current) return;

    try {
      setLastResult(null);
      setTranscript('');
      setVoiceError(null);
      currentTranscriptRef.current = '';
      window.speechSynthesis?.cancel();

      // Test permission and release track immediately so SpeechRecognition has full exclusive mic access!
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const testStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          testStream.getTracks().forEach((track) => track.stop());
        } catch (permErr: any) {
          console.warn('Microphone permission issue:', permErr);
          if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
            setVoiceError('Microphone permission was denied. Please allow microphone access in your browser or macOS Settings.');
            setIsListening(false);
            isListeningRef.current = false;
            return;
          }
        }
      }

      isListeningRef.current = true;
      setIsListening(true);
      recognitionRef.current.start();

      // Max idle timeout: automatically close if completely silent for 12 seconds
      if (maxIdleTimerRef.current) clearTimeout(maxIdleTimerRef.current);
      maxIdleTimerRef.current = setTimeout(() => {
        if (isListeningRef.current && !currentTranscriptRef.current.trim()) {
          stopListening();
        }
      }, 12000);
    } catch (err) {
      console.warn('Error starting speech recognition:', err);
      // If already started or in transition, retry
      try {
        recognitionRef.current.stop();
      } catch {}
    }
  }, [stopListening]);

  const toggleVoiceListening = useCallback(() => {
    if (isListening) {
      const textToSubmit = currentTranscriptRef.current.trim();
      stopListening();
      if (textToSubmit) {
        handleRunVoicePrompt(textToSubmit);
      }
    } else {
      startListening();
    }
  }, [isListening, stopListening, startListening]);

  const startListeningAfterDelay = useCallback(() => {
    setTimeout(() => {
      startListening();
    }, 400);
  }, [startListening]);

  const handleRunVoicePrompt = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed) return;

    const userMsgId = `user_${Date.now()}`;
    const newMessages = [
      ...messages,
      { id: userMsgId, role: 'user' as const, content: trimmed },
    ];
    setMessages(newMessages);
    setInputText('');
    setTranscript('');
    setIsThinking(true);

    try {
      let data: any = null;

      // 1. If running inside native macOS Tauri app, use native Rust command directly!
      if (typeof window !== 'undefined' && ((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__)) {
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          data = await invoke('chat_with_agent', {
            messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          });
        } catch (tauriErr) {
          console.warn('Native Tauri invoke error, trying fetch fallback:', tauriErr);
        }
      }

      // Fallback to HTTP API if running in standalone web browser
      if (!data) {
        const res = await fetch('/api/agent/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          }),
        });

        if (res.ok) {
          data = await res.json();
        }
      }

      if (data) {
        const replyText = data.reply || '';
        const toolCalls = data.tool_calls || [];

        let toolExecuted = false;
        let lastToolResult: ToolExecutionResult | null = null;
        let lastToolName = '';

        // Execute any returned tool calls via client harness
        for (const call of toolCalls) {
          const fnName = call.function?.name;
          let parsedArgs = {};
          try {
            parsedArgs = JSON.parse(call.function?.arguments || '{}');
          } catch {}

          if (fnName) {
            lastToolName = fnName;
            lastToolResult = await FixatesHarness.executeTool(fnName, parsedArgs, 'agent');
            toolExecuted = true;
          }
        }

        if (lastToolResult) {
          setLastResult(lastToolResult);
        }

        const finalReply = replyText || (lastToolResult ? lastToolResult.message : 'Done.');

        const assistantMsg = {
          id: `asst_${Date.now()}`,
          role: 'assistant' as const,
          content: finalReply,
          toolName: toolExecuted ? lastToolName : undefined,
          success: lastToolResult ? lastToolResult.success : undefined,
        };

        setMessages((prev) => [...prev, assistantMsg]);

        // Speak aloud with TTS. If the assistant asks a question (clarification), auto-listen for the user's answer!
        const isQuestion = finalReply.trim().endsWith('?') || finalReply.toLowerCase().includes('what time');
        speakResponse(finalReply, isQuestion ? startListeningAfterDelay : undefined);
      } else {
        // Fallback: Use client-side regex parser if AI API fails or is unconfigured
        const fallbackResult = await FixatesHarness.executeVoiceCommand(trimmed);
        setLastResult(fallbackResult);
        const fallbackReply = fallbackResult.message;
        setMessages((prev) => [
          ...prev,
          {
            id: `asst_${Date.now()}`,
            role: 'assistant',
            content: fallbackReply,
            success: fallbackResult.success,
          },
        ]);
        speakResponse(fallbackReply);
      }
    } catch (err: any) {
      // Local fallback on network error
      const fallbackResult = await FixatesHarness.executeVoiceCommand(trimmed);
      setLastResult(fallbackResult);
      const fallbackReply = fallbackResult.message;
      setMessages((prev) => [
        ...prev,
        {
          id: `asst_${Date.now()}`,
          role: 'assistant',
          content: fallbackReply,
          success: fallbackResult.success,
        },
      ]);
      speakResponse(fallbackReply);
    } finally {
      setIsThinking(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setLastResult(null);
    window.speechSynthesis?.cancel();
  };

  const handleRunSelectedTool = async () => {
    if (!selectedTool) return;
    const result = await FixatesHarness.executeTool(selectedTool.name, toolParamInputs, 'manual');
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
                  Fixates Agent &amp; Voice Harness
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
            <span>Tool Registry ({FIXATES_TOOL_REGISTRY.length})</span>
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

                {/* Voice / TTS Controls Bar */}
                <div className="flex items-center justify-between w-full pt-1 px-1 border-t border-outline-variant/15 text-xs text-outline">
                  <button
                    type="button"
                    onClick={() => setTtsEnabled(!ttsEnabled)}
                    className="flex items-center gap-1.5 hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {ttsEnabled ? 'volume_up' : 'volume_off'}
                    </span>
                    <span>Voice Output: {ttsEnabled ? 'On' : 'Muted'}</span>
                  </button>

                  {messages.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearChat}
                      className="flex items-center gap-1 text-[11px] text-outline hover:text-red-500 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete_sweep</span>
                      <span>Clear Chat</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Voice Error Diagnostic Banner */}
              {voiceError && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between animate-fadeIn shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-amber-500 shrink-0">warning</span>
                    <span>{voiceError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVoiceError(null)}
                    className="text-amber-500 hover:text-amber-700 p-1 rounded-lg"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              )}

              {/* Conversational AI Dialogue History */}
              {messages.length > 0 && (
                <div className="flex flex-col gap-2.5 max-h-[260px] overflow-y-auto p-3 rounded-2xl bg-surface-container-low/60 border border-outline-variant/20">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-outline px-1">
                        <span className="material-symbols-outlined text-[12px]">
                          {m.role === 'user' ? 'person' : 'smart_toy'}
                        </span>
                        <span>{m.role === 'user' ? 'You' : 'Fixates AI'}</span>
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs flex items-center gap-2 ${
                          m.role === 'user'
                            ? 'bg-primary text-on-primary rounded-tr-xs'
                            : 'bg-surface-container text-on-surface border border-outline-variant/30 rounded-tl-xs'
                        }`}
                      >
                        <span className="leading-relaxed">{m.content}</span>
                        {m.role === 'assistant' && (
                          <button
                            type="button"
                            onClick={() => speakResponse(m.content)}
                            title="Replay voice audio"
                            className="w-5 h-5 rounded-full hover:bg-surface-container-high flex items-center justify-center text-outline hover:text-primary transition-colors shrink-0"
                          >
                            <span className="material-symbols-outlined text-[14px]">volume_up</span>
                          </button>
                        )}
                      </div>

                      {/* Tool Execution Tag */}
                      {m.toolName && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                          <span className="material-symbols-outlined text-[12px]">build</span>
                          <span>Executed: {m.toolName}</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Thinking Bubble */}
                  {isThinking && (
                    <div className="flex flex-col gap-1 items-start animate-fadeIn">
                      <div className="flex items-center gap-1.5 text-[10px] text-outline px-1">
                        <span className="material-symbols-outlined text-[12px]">smart_toy</span>
                        <span>Fixates AI</span>
                      </div>
                      <div className="rounded-2xl px-3.5 py-2 bg-surface-container text-outline border border-outline-variant/30 text-xs flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                        <span>Thinking &amp; analyzing command...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Real-time Voice Translation & Debounce Indicator */}
              {isListening && (
                <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-violet-500/10 dark:bg-violet-500/15 border border-violet-500/30 text-xs animate-fadeIn shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-600"></span>
                    </span>
                    <span className="font-semibold text-[11px] uppercase tracking-wider text-violet-600 dark:text-violet-400 shrink-0">
                      Live Translation:
                    </span>
                    <span className="text-on-surface font-medium truncate italic">
                      {transcript ? `"${transcript}"` : 'Listening to speech...'}
                    </span>
                  </div>
                  {isDebouncing && (
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-mono shrink-0 ml-2 animate-pulse shadow-xs">
                      <span className="material-symbols-outlined text-[12px]">schedule</span>
                      <span>Calling AI in 1s...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Natural Language Prompt Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                  setIsDebouncing(false);
                  stopListening();
                  handleRunVoicePrompt(inputText);
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <span className={`material-symbols-outlined absolute left-3.5 top-3 text-[18px] transition-colors ${
                    isListening ? 'text-violet-500 animate-pulse' : 'text-outline'
                  }`}>
                    {isListening ? 'mic' : 'keyboard'}
                  </span>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      if (isListening) {
                        currentTranscriptRef.current = e.target.value;
                      }
                    }}
                    placeholder={
                      isListening
                        ? 'Translating speech into text in real-time...'
                        : "Type or speak (e.g. 'remind me to call mom tonight', 'start 25m pomodoro')..."
                    }
                    className={`w-full bg-surface-container-low pl-10 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm text-on-surface placeholder:text-outline border outline-none transition-all ${
                      isListening
                        ? 'border-violet-500 ring-2 ring-violet-500/20 shadow-xs'
                        : 'border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary'
                    }`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!inputText.trim() || isThinking}
                  className="px-4 py-2.5 rounded-2xl bg-primary text-on-primary text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5 shrink-0"
                >
                  <span>{isThinking ? 'Thinking...' : isDebouncing ? 'Sending...' : 'Send'}</span>
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
                  Registered Functions ({FIXATES_TOOL_REGISTRY.length})
                </span>
                {FIXATES_TOOL_REGISTRY.map((t) => (
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
